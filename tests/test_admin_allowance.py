import copy
import os
import unittest
from concurrent.futures import ThreadPoolExecutor
from unittest.mock import patch

from fastapi import HTTPException
from fastapi.testclient import TestClient
from backend import main, credit_api
from backend.credit_store import MemoryStore
from backend.credits import CreditService

USER = {'sub': 'gift-teacher', 'email': 'teacher@example.invalid'}


class AdminAllowanceTests(unittest.TestCase):
    def setUp(self):
        self.store = MemoryStore()
        self.service = CreditService(self.store, admins=['admin'])
        self.service.me(USER)

    def adjust(self, product, action, amount, operation='gift-request-01'):
        return self.service.admin_adjust('admin', USER['sub'], operation, product, action, amount, 'Quà tặng kiểm thử')

    def test_arbitrary_gifts_and_removals_have_no_payment_or_purchase_side_effects(self):
        order = self.service.request_purchase(USER, 'pending-order-01', 'exam', 10)
        self.adjust('exam', 'add', 7)
        self.adjust('manual', 'add', 5, 'gift-manual-01')
        self.adjust('exam', 'remove', 3, 'remove-exam-01')
        self.adjust('manual', 'remove', 4, 'remove-manual-01')
        account = self.service.me(USER)
        self.assertEqual((account['balance'], account['manualBalance']), (6, 4))
        self.assertEqual(account['activePurchaseId'], order['id'])
        self.assertEqual(self.service.purchases(USER['sub'])[0]['status'], 'pending')
        events = [e for e in self.service.history(USER['sub']) if e.get('source') == 'admin_adjustment']
        self.assertEqual(len(events), 4)
        self.assertEqual({e['kind'] for e in events}, {'gift', 'revoke'})
        self.assertTrue(all(e['priceVnd'] == 0 and e['actorUid'] == 'admin' for e in events))
        self.assertFalse(any('_receipts/' in path or '_payment_events/' in path for path in self.store.documents))

    def test_parallel_retry_applies_once_and_changed_intent_is_rejected(self):
        with ThreadPoolExecutor(max_workers=8) as pool:
            list(pool.map(lambda _: self.adjust('exam', 'add', 7), range(16)))
        self.assertEqual(self.service.me(USER)['balance'], 9)
        with self.assertRaises(HTTPException) as raised:
            self.adjust('manual', 'add', 7)
        self.assertEqual(raised.exception.detail['code'], 'request_conflict')
        self.assertEqual(self.service.me(USER)['manualBalance'], 3)

    def test_concurrent_distinct_removals_cannot_make_balance_negative(self):
        def remove(i):
            try:
                self.adjust('manual', 'remove', 1, f'remove-request-{i:02}')
                return True
            except HTTPException as error:
                self.assertEqual(error.detail['code'], 'insufficient_available_allowance')
                return False
        with ThreadPoolExecutor(max_workers=8) as pool:
            outcomes = list(pool.map(remove, range(12)))
        self.assertEqual(sum(outcomes), 3)
        self.assertEqual(self.service.me(USER)['manualBalance'], 0)

    def test_removal_preserves_reservations_and_cancellation_refunds(self):
        slot = {'id': 'slot-1', 'part': 'mcq', 'order': 1}
        exam = self.service.create(USER, 'held-exam-01', {}, [slot])
        run = self.service.create_manual_run(USER, 'held-manual-01', [
            {'prompt': 'Create a biology question.', 'expectedCount': 1, 'lang': 'vi'}])
        self.adjust('exam', 'remove', 1)
        self.adjust('manual', 'remove', 2, 'remove-held-01')
        account = self.service.me(USER)
        self.assertEqual((account['balance'], account['held'], account['manualBalance'], account['manualHeld']), (0, 1, 0, 1))
        before = copy.deepcopy(self.store.documents)
        with self.assertRaises(HTTPException):
            self.adjust('exam', 'remove', 1, 'excess-remove-01')
        self.assertEqual(before, self.store.documents)
        self.service.cancel(USER, exam['id'])
        self.service.cancel_manual(USER, run['id'])
        account = self.service.me(USER)
        self.assertEqual((account['balance'], account['held'], account['manualBalance'], account['manualHeld']), (1, 0, 1, 0))

    def test_no_trial_reset_on_login_or_restart_and_blocked_status_is_preserved(self):
        self.adjust('exam', 'remove', 2)
        self.adjust('manual', 'remove', 3, 'remove-trial-01')
        restarted = CreditService(self.store, admins=['admin'])
        account = restarted.me(USER)
        self.assertEqual((account['balance'], account['manualBalance']), (0, 0))
        self.service.admin_change('admin', USER['sub'], 'block-gift-01', status='blocked')
        self.adjust('exam', 'add', 7, 'gift-blocked-01')
        self.assertEqual(self.service.me(USER)['status'], 'blocked')

    def test_permission_validation_and_unknown_account_leave_store_unchanged(self):
        for args in [
            ('teacher', USER['sub'], 'valid-request-01', 'exam', 'add', 1, 'Gift'),
            ('admin', 'missing-user', 'valid-request-01', 'exam', 'add', 1, 'Gift'),
            ('admin', USER['sub'], 'bad', 'exam', 'add', 1, 'Gift'),
            ('admin', USER['sub'], 'valid-request-01', 'exam', 'add', 1, '  '),
            *[('admin', USER['sub'], 'valid-request-01', 'exam', 'add', amount, 'Gift') for amount in (0, -1, 1.5, True, 10001)],
        ]:
            with self.subTest(args=args):
                before = copy.deepcopy(self.store.documents)
                with self.assertRaises(HTTPException):
                    self.service.admin_adjust(*args)
                self.assertEqual(before, self.store.documents)


class AdminAllowanceApiTests(unittest.TestCase):
    def setUp(self):
        self.store = MemoryStore()
        self.service = CreditService(self.store, admins=['admin'])
        self.service.me(USER)
        self.env = patch.dict(os.environ, {'CREDITS_ENABLED': 'true'})
        self.env.start()
        self.service_patch = patch.object(credit_api, 'service', return_value=self.service)
        self.service_patch.start()
        main.app.dependency_overrides[main.require_firebase_user] = lambda: USER
        self.client = TestClient(main.app)
        self.payload = {'uid': USER['sub'], 'requestId': 'api-gift-request-01', 'product': 'manual', 'action': 'add', 'amount': 8, 'note': 'Quà tặng'}

    def tearDown(self):
        self.service_patch.stop()
        self.env.stop()
        main.app.dependency_overrides.clear()

    def test_teacher_cannot_adjust_and_admin_can_retry_without_receipt(self):
        self.assertEqual(self.client.post('/api/credits/admin/adjust', json=self.payload).status_code, 403)
        main.app.dependency_overrides[main.require_firebase_user] = lambda: {'sub': 'admin'}
        for _ in range(2):
            response = self.client.post('/api/credits/admin/adjust', json=self.payload)
            self.assertEqual(response.status_code, 200, response.text)
            self.assertEqual(response.json()['manualBalance'], 11)
        self.assertEqual(self.service.me(USER)['balance'], 2)

    def test_amounts_are_strict_integers_and_payment_fields_cannot_be_mixed(self):
        main.app.dependency_overrides[main.require_firebase_user] = lambda: {'sub': 'admin'}
        for fields in [{'amount': v} for v in (True, 1.0, '2', 0, -1, 10001)] + [{'note': '   '}, {'package': 10}, {'purchaseId': 'order-00001'}, {'paymentReference': 'FORGED'}]:
            with self.subTest(fields=fields):
                response = self.client.post('/api/credits/admin/adjust', json={**self.payload, **fields})
                self.assertEqual(response.status_code, 422, response.text)
        self.assertEqual(self.service.me(USER)['manualBalance'], 3)
