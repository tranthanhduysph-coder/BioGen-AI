import hashlib
import hmac
import json
import os
import time
import unittest
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timedelta, timezone
from unittest.mock import patch
from fastapi import HTTPException
from fastapi.testclient import TestClient
from backend import main, credit_api
from backend.credits import CreditService, fingerprint
from backend.credit_store import MemoryStore
from backend.payment_config import PLANS
from backend.payments import BankTransaction, settle_notification, verify_notification

USER = {'sub':'payment-teacher', 'email':'teacher@example.invalid'}
TEST_SECRET = 'synthetic-payment-test-secret-000000000000'
TEST_VA = '96247BIOGENTEST'


class PaymentTests(unittest.TestCase):
    def setUp(self):
        self.service = CreditService(MemoryStore(), admins=['admin'])
        va_env = patch.dict(os.environ, {'SEPAY_BIDV_VA': TEST_VA})
        va_env.start()
        self.addCleanup(va_env.stop)

    def purchase(self, product='exam', package=10, request_id='payment-order-01'):
        return self.service.request_purchase(USER, request_id, product, package)

    def event(self, order, **changes):
        values = {'id':10001, 'gateway':'BIDV', 'accountNumber':PLANS['bank']['accountNumber'], 'subAccount':TEST_VA,
            'transactionDate':datetime.now(timezone(timedelta(hours=7))).strftime('%Y-%m-%d %H:%M:%S'),
            'code':order['paymentCode'], 'content':order['paymentCode']+' chuyen tien',
            'transferType':'in', 'transferAmount':order['expectedAmount'], 'referenceCode':'BANK-TEST-10001'}
        return BankTransaction(**{**values, **changes})

    def test_each_confirmed_plan_credits_only_the_correct_wallet(self):
        for product, package, amount in [('exam',10,199000), ('exam',20,349000), ('exam',30,479000), ('manual',3,20000)]:
            with self.subTest(product=product, package=package):
                self.service = CreditService(MemoryStore(), admins=['admin'])
                order = self.purchase(product, package)
                self.assertEqual(order['expectedAmount'], amount)
                self.assertEqual(settle_notification(self.service, self.event(order)), 'fulfilled')
                a = self.service.me(USER)
                self.assertEqual(a['balance'], 2+(package if product=='exam' else 0))
                self.assertEqual(a['manualBalance'], 3+(package if product=='manual' else 0))
                self.assertIsNone(a['activePurchaseId'])

    def test_concurrent_retry_consumes_one_bank_receipt_and_grants_once(self):
        order = self.purchase()
        payload = self.event(order)
        with ThreadPoolExecutor(max_workers=8) as pool:
            statuses = list(pool.map(lambda _: settle_notification(self.service, payload), range(20)))
        self.assertEqual(set(statuses), {'fulfilled'})
        self.assertEqual(self.service.me(USER)['balance'], 12)
        grants = [e for e in self.service.history(USER['sub']) if e.get('source')=='sepay']
        self.assertEqual(len(grants), 1)

    def test_wrong_direction_recipient_unknown_or_ambiguous_code_never_grant(self):
        order = self.purchase()
        for changes in [dict(transferType='out'), dict(accountNumber='OTHER'), dict(gateway='OtherBank'),
                        dict(gateway='Techcombank'), dict(subAccount=''), dict(subAccount=None), dict(subAccount='96247OTHER'),
                        dict(code=None,content='No code'), dict(code='BGP'+'F'*20,content='Unknown code'),
                        dict(content=order['paymentCode']+' BGP'+'F'*20)]:
            with self.subTest(changes=changes):
                settle_notification(self.service, self.event(order, **changes))
                self.assertEqual(self.service.me(USER)['balance'], 2)

    def test_bidv_order_snapshots_va_and_cannot_settle_for_a_changed_recipient(self):
        order = self.purchase()
        self.assertEqual(order['bank']['id'], 'BIDV')
        self.assertEqual(order['bank']['accountNumber'], '1410373736')
        self.assertEqual(order['bank']['virtualAccountNumber'], TEST_VA)
        with patch.dict(os.environ, {'SEPAY_BIDV_VA': '96247NEWVA'}):
            status = settle_notification(self.service, self.event(order, subAccount='96247NEWVA'))
        self.assertEqual(status, 'recipient_mismatch')
        self.assertEqual(self.service.me(USER)['balance'], 2)

    def test_unconfigured_va_never_accepts_a_transfer_into_the_main_account(self):
        order = self.purchase()
        with patch.dict(os.environ, {'SEPAY_BIDV_VA': ''}):
            self.assertEqual(settle_notification(self.service, self.event(order)), 'ignored')
        self.assertEqual(self.service.me(USER)['balance'], 2)

    def test_wrong_amount_and_old_transfer_are_audited_without_grant(self):
        order = self.purchase()
        status = settle_notification(self.service, self.event(order,transferAmount=199001))
        self.assertEqual(status, 'amount_mismatch')
        self.assertEqual(self.service.purchases(USER['sub'])[0]['paymentIssue'], status)
        old = self.event(order,id=10002,referenceCode='BANK-OLD',transactionDate='2020-01-01 00:00:00')
        self.assertEqual(settle_notification(self.service, old), 'transaction_before_order')
        self.assertEqual(self.service.me(USER)['balance'], 2)
        self.assertEqual(len(self.service.store.list(f'{self.service.namespace}_payment_events')), 2)

    def test_reused_reference_changed_payload_and_extra_transfer_cannot_grant_twice(self):
        order = self.purchase()
        settle_notification(self.service, self.event(order))
        with self.assertRaises(HTTPException):
            settle_notification(self.service, self.event(order,transferAmount=1))
        self.assertEqual(settle_notification(self.service,self.event(order,id=10002,referenceCode='BANK-SECOND')), 'order_closed')
        next_order = self.purchase(request_id='payment-order-02')
        self.assertEqual(settle_notification(self.service,self.event(next_order,id=10003)), 'receipt_already_used')
        self.assertEqual(self.service.me(USER)['balance'], 12)

    def test_blocked_account_payment_preserves_block_and_admin_cannot_double_grant(self):
        order = self.purchase('manual',3)
        self.service.admin_change('admin', USER['sub'], 'block-payment-1', status='blocked')
        settle_notification(self.service,self.event(order))
        account = self.service.me(USER)
        self.assertEqual((account['status'],account['manualBalance']),('blocked',6))
        with self.assertRaises(HTTPException):
            self.service.admin_change('admin', USER['sub'], 'duplicate-pay-1', manual_package=3,
                payment_reference='BANK-TEST-10001', purchase_id=order['id'])

    def test_legacy_pending_order_can_prepare_qr_without_granting(self):
        order = self.purchase()
        path = f'{self.service.account_path(USER["sub"])}/purchases/{order["id"]}'
        for key in ('paymentCode','expectedAmount','bank'):
            self.service.store.documents[path].pop(key)
        prepared = self.service.prepare_purchase_payment(USER, order['id'])
        self.assertEqual(prepared['expectedAmount'],199000)
        self.assertEqual(self.service.prepare_purchase_payment(USER,order['id'])['paymentCode'],prepared['paymentCode'])
        self.assertEqual(self.service.me(USER)['balance'],2)


class WebhookApiTests(unittest.TestCase):
    purchase = PaymentTests.purchase
    event = PaymentTests.event

    def setUp(self):
        PaymentTests.setUp(self)
        self.env = patch.dict(os.environ, {'CREDITS_ENABLED':'true','AUTOMATIC_PAYMENTS_ENABLED':'true',
            'SEPAY_WEBHOOK_AUTH':'hmac','SEPAY_WEBHOOK_SECRET':TEST_SECRET})
        self.env.start()
        self.service_patch = patch.object(credit_api, 'service', return_value=self.service)
        self.service_patch.start()
        main.app.dependency_overrides[main.require_firebase_user] = lambda: USER
        self.client = TestClient(main.app)

    def tearDown(self):
        self.service_patch.stop();self.env.stop();main.app.dependency_overrides.clear()

    def headers(self, body, timestamp=None):
        timestamp=str(int(time.time()) if timestamp is None else timestamp)
        signature=hmac.new(TEST_SECRET.encode(),timestamp.encode()+b'.'+body,hashlib.sha256).hexdigest()
        return {'Content-Type':'application/json','X-SePay-Timestamp':timestamp,'X-SePay-Signature':'sha256='+signature}

    def test_valid_hmac_acknowledges_and_then_teacher_sees_credits(self):
        order=self.purchase()
        body=json.dumps(self.event(order).model_dump()).encode()
        result=self.client.post('/api/payments/sepay/webhook',content=body,headers=self.headers(body))
        self.assertEqual((result.status_code,result.json()),(200,{'success':True}))
        self.assertEqual(self.client.get('/api/credits/me').json()['balance'],12)
        self.assertEqual(self.client.get('/api/credits/admin/payment-events').status_code,403)

    def test_bidv_qr_remains_disabled_until_a_valid_va_is_configured(self):
        for value in ('', '96247', 'BIOGENAI', '96247INVALID!'):
            with self.subTest(va=value), patch.dict(os.environ, {'SEPAY_BIDV_VA': value}):
                config = self.client.get('/api/payment-plans').json()
                self.assertFalse(config['automaticPaymentReady'])
                self.assertEqual(config['bank']['virtualAccountNumber'], '')
        config = self.client.get('/api/payment-plans').json()
        self.assertTrue(config['automaticPaymentReady'])
        self.assertEqual(config['bank']['virtualAccountNumber'], TEST_VA)

    def test_forged_stale_tampered_and_disabled_notifications_fail_closed(self):
        order=self.purchase()
        body=json.dumps(self.event(order).model_dump()).encode()
        for headers,data in [({'Content-Type':'application/json'},body),
            (self.headers(body,int(time.time())-301),body),
            (self.headers(body),body+b' '),
            ({'Content-Type':'application/json','Authorization':'Bearer a-firebase-token'},body)]:
            self.assertEqual(self.client.post('/api/payments/sepay/webhook',content=data,headers=headers).status_code,401)
        with patch.dict(os.environ,{'AUTOMATIC_PAYMENTS_ENABLED':'false'}):
            self.assertEqual(self.client.post('/api/payments/sepay/webhook',content=body,headers=self.headers(body)).status_code,503)
        self.assertEqual(self.service.me(USER)['balance'],2)

    def test_api_key_only_when_explicitly_configured_and_public_config_never_exposes_secret(self):
        body=json.dumps(self.event(self.purchase('manual',3)).model_dump()).encode()
        with patch.dict(os.environ,{'SEPAY_WEBHOOK_AUTH':'apikey'}):
            headers={'Content-Type':'application/json','Authorization':'Apikey '+TEST_SECRET}
            result=self.client.post('/api/payments/sepay/webhook',content=body,headers=headers)
            self.assertEqual(result.status_code,200)
        config=self.client.get('/api/payment-plans')
        self.assertNotIn(TEST_SECRET,config.text)
        self.assertTrue(config.json()['automaticPaymentReady'])

    def test_validation_does_not_echo_bank_data_and_zero_test_event_never_grants(self):
        values=self.event(self.purchase()).model_dump();values['id']=0;values['description']='PRIVATE-PAYER-DETAIL'
        body=json.dumps(values).encode()
        result=self.client.post('/api/payments/sepay/webhook',content=body,headers=self.headers(body))
        self.assertEqual(result.status_code,422)
        self.assertNotIn('PRIVATE-PAYER-DETAIL',result.text)
        self.assertEqual(self.service.me(USER)['balance'],2)


if __name__=='__main__':
    unittest.main()
