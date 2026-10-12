import copy
import os
import unittest
from concurrent.futures import ThreadPoolExecutor
from unittest.mock import patch, Mock
from fastapi import HTTPException
from fastapi.testclient import TestClient
from backend.credits import CreditService
from backend.credit_store import MemoryStore, FirestoreStore
from backend import main, credit_api


USER = {'sub': 'teacher', 'email': 'teacher@example.invalid'}
SLOT = {'id': 'mcq-q01', 'part': 'mcq', 'order': 1, 'contentId': 'test',
        'contentLabel': 'Sinh học', 'competencyCode': 'NT1', 'outcomeId': 'test-1',
        'outcomeText': 'Nêu khái niệm sinh học', 'level': 'know'}
QUESTION = {'question': 'Câu hỏi?', 'type': 'Multiple choices', 'options': ['A', 'B', 'C', 'D'],
            'answer': 'A', 'explanation': 'Giải thích'}


class CreditTests(unittest.TestCase):
    def setUp(self):
        self.now = 1000
        self.store = MemoryStore()
        self.service = CreditService(self.store, admins=['admin'], clock=lambda: self.now, automatic_trials=False)
        self.service.me(USER)
        self.service.admin_change('admin', 'teacher', 'approve-0001', status='approved')
        self.service.admin_change('admin', 'teacher', 'grant-00001', package=10)

    def slots(self, count=5):
        return [{**SLOT, 'id': f'mcq-q{i:02}', 'order': i} for i in range(1, count + 1)]

    def create(self, count=5, operation='exam-00001'):
        return self.service.create(USER, operation, {'title': 'Đề'}, self.slots(count))

    def generate(self, exam_id, slot_id, operation, replace=False):
        claim = self.service.claim(USER, exam_id, slot_id, operation, replace)
        if 'cached' in claim:
            return claim['cached']
        slot = claim['slot']
        item = {'slotId': slot_id, 'part': slot['part'], 'order': slot['order'], 'question': QUESTION}
        return self.service.finish(USER, exam_id, claim['nonce'], item)

    def assert_code(self, code, function):
        with self.assertRaises(HTTPException) as raised:
            function()
        self.assertEqual(raised.exception.detail['code'], code)

    def test_two_tabs_one_reservation_and_one_credit(self):
        with ThreadPoolExecutor(max_workers=8) as pool:
            results = list(pool.map(lambda _: self.create(), range(16)))
        self.assertEqual({r['id'] for r in results}, {'exam-00001'})
        account = self.service.me(USER)
        self.assertEqual((account['balance'], account['held']), (9, 1))
        self.assertEqual(len(self.service.history('teacher')), 3)

    def test_pending_blocked_and_insufficient_accounts_cannot_reserve(self):
        pending = {'sub': 'pending'}
        self.service.me(pending)
        self.assert_code('account_not_approved', lambda: self.service.create(pending, 'pending-exam', {}, self.slots()))
        self.service.admin_change('admin', 'pending', 'approve-0002', status='approved')
        self.assert_code('insufficient_credits', lambda: self.service.create(pending, 'pending-exam', {}, self.slots()))
        self.service.admin_change('admin', 'teacher', 'block-00001', status='blocked')
        self.assert_code('account_not_approved', self.create)

    def test_active_exam_and_request_collision(self):
        self.create()
        self.assert_code('active_exam', lambda: self.create(operation='exam-00002'))
        self.assert_code('request_conflict', lambda: self.create(count=6))

    def test_completion_is_charged_once_and_survives_process_restart(self):
        self.create(count=1)
        self.generate('exam-00001', 'mcq-q01', 'item-00001')
        self.service = CreditService(self.store, admins=['admin'], clock=lambda: self.now, automatic_trials=False)
        self.generate('exam-00001', 'mcq-q01', 'item-00001')
        self.generate('exam-00001', 'mcq-q01', 'item-00002')
        self.assertEqual(self.service.get_exam(USER, 'exam-00001')['status'], 'completed')
        a = self.service.me(USER)
        self.assertEqual((a['balance'], a['held']), (9, 0))
        self.assertEqual([e['kind'] for e in self.service.history('teacher')].count('consume'), 1)

    def test_failed_generation_keeps_credit_and_releases_lease(self):
        self.create()
        claim = self.service.claim(USER, 'exam-00001', 'mcq-q01', 'item-00001')
        self.service.release(USER, 'exam-00001', claim['nonce'])
        self.generate('exam-00001', 'mcq-q01', 'item-00001')
        self.assertEqual((self.service.me(USER)['balance'], self.service.me(USER)['held']), (9, 1))

    def test_busy_lease_expiry_and_stale_result_fencing(self):
        self.create()
        first = self.service.claim(USER, 'exam-00001', 'mcq-q01', 'item-00001')
        self.assert_code('exam_busy', lambda: self.service.claim(USER, 'exam-00001', 'mcq-q01', 'item-00002'))
        self.now += 241
        second = self.service.claim(USER, 'exam-00001', 'mcq-q01', 'item-00002')
        self.service.release(USER, 'exam-00001', first['nonce'])
        self.assertEqual(self.service.get_exam(USER, 'exam-00001')['lease']['nonce'], second['nonce'])
        self.assert_code('stale_generation', lambda: self.service.finish(USER, 'exam-00001', first['nonce'], {}))

    def test_replacement_lost_response_replays_without_second_allowance(self):
        self.create()
        for i in range(1, 6):
            self.generate('exam-00001', f'mcq-q{i:02}', f'initial-{i}')
        self.generate('exam-00001', 'mcq-q01', 'replace-001', True)
        self.generate('exam-00001', 'mcq-q01', 'replace-001', True)
        self.assertEqual(self.service.get_exam(USER, 'exam-00001')['replacedUnits'], 1)
        self.assert_code('replacement_limit', lambda: self.generate('exam-00001', 'mcq-q01', 'replace-002', True))

    def test_capacity_counts_tf_as_four_and_rejects_duplicate_slots(self):
        slots = self.slots(37) + [{**SLOT, 'id': 'tf-q01', 'part': 'tf'}]
        self.assert_code('exam_capacity', lambda: self.service.create(USER, 'exam-00001', {}, slots))
        self.assert_code('exam_capacity', lambda: self.service.create(USER, 'exam-00001', {}, [SLOT, SLOT]))
        self.assertEqual(self.service.me(USER)['balance'], 10)

    def test_foreign_owner_and_unknown_slot_cannot_read_or_generate(self):
        self.create()
        self.assert_code('exam_not_found', lambda: self.service.get_exam({'sub': 'other'}, 'exam-00001'))
        self.assert_code('invalid_slot', lambda: self.service.claim(USER, 'exam-00001', 'forged', 'item-00001'))

    def test_admin_grant_retry_and_trial_are_idempotent(self):
        self.service.admin_change('admin', 'teacher', 'grant-00001', package=10)
        self.assertEqual(self.service.me(USER)['balance'], 10)
        self.assert_code('request_conflict', lambda: self.service.admin_change('admin', 'teacher', 'grant-00001', package=20))
        self.service.admin_change('admin', 'teacher', 'trial-00001', trial=True)
        self.service.admin_change('admin', 'teacher', 'trial-00001', trial=True)
        self.assert_code('trial_already_granted', lambda: self.service.admin_change('admin', 'teacher', 'trial-00002', trial=True))
        self.assert_code('admin_required', lambda: self.service.admin_change('teacher', 'teacher', 'hack-000001', package=30))

    def test_payment_reference_prevents_duplicate_grant_after_reload(self):
        self.service.admin_change('admin', 'teacher', 'payment-0001', package=20, payment_reference='BANK-TXN-001')
        self.service.admin_change('admin', 'teacher', 'payment-0002', package=20, payment_reference='bank-txn-001')
        self.assertEqual(self.service.me(USER)['balance'], 30)
        self.assert_code('payment_reference_conflict', lambda: self.service.admin_change(
            'admin', 'teacher', 'payment-0003', package=30, payment_reference='BANK-TXN-001'))

    def test_refund_zero_questions_and_admin_partial_refund_only_once(self):
        self.create()
        self.service.cancel(USER, 'exam-00001')
        self.service.cancel(USER, 'exam-00001')
        self.assertEqual(self.service.me(USER)['balance'], 10)
        self.create(operation='exam-00002')
        self.generate('exam-00002', 'mcq-q01', 'item-00001')
        self.assert_code('refund_review_required', lambda: self.service.cancel(USER, 'exam-00002'))
        self.service.cancel(USER, 'exam-00002', admin=True, actor_uid='admin', note='Provider failure')
        self.assertEqual(self.service.me(USER)['balance'], 10)

    def test_review_cannot_fake_completion_or_credit_charge(self):
        self.create()
        self.assert_code('invalid_review', lambda: self.service.save_review(USER, 'exam-00001', {'generatedItems': [{'slotId': 'mcq-q01'}]}))
        self.generate('exam-00001', 'mcq-q01', 'item-00001')
        self.service.save_review(USER, 'exam-00001', {'generatedItems': [], 'approvedSlotIds': []})
        self.assertEqual(self.service.get_exam(USER, 'exam-00001')['status'], 'reserved')

    def test_replacement_preserves_other_manual_edits_and_invalidates_only_its_approval(self):
        self.create()
        for i in range(1, 6):
            self.generate('exam-00001', f'mcq-q{i:02}', f'initial-{i}')
        items = list(self.service.get_exam(USER, 'exam-00001')['items'].values())
        items[1]['question']['question'] = 'Teacher edit'
        self.service.save_review(USER, 'exam-00001', {'generatedItems': items,
            'approvedSlotIds': ['mcq-q01', 'mcq-q02'], 'lockedQuestionIds': ['mcq-q01', 'mcq-q02']})
        self.generate('exam-00001', 'mcq-q01', 'replace-001', True)
        review = self.service.get_exam(USER, 'exam-00001')['review']
        self.assertEqual(review['generatedItems'][1]['question']['question'], 'Teacher edit')
        self.assertEqual(review['approvedSlotIds'], ['mcq-q02'])

    def test_usage_counts_format_retry_tokens_without_charging_extra_credit(self):
        self.create()
        claim = self.service.claim(USER, 'exam-00001', 'mcq-q01', 'item-00001')
        for _ in range(2):
            self.service.record_usage(USER, 'exam-00001', claim['nonce'],
                {'calls': 1, 'inputTokens': 100, 'outputTokens': 50, 'thinkingTokens': 20})
        self.assertEqual(self.service.get_exam(USER, 'exam-00001')['usage']['calls'], 2)
        self.assertEqual(self.service.me(USER)['held'], 1)


class CreditApiTests(unittest.TestCase):
    def setUp(self):
        self.store = MemoryStore()
        self.service = CreditService(self.store, admins=['admin'], automatic_trials=False)
        self.service.me(USER)
        self.service.admin_change('admin', 'teacher', 'grant-00001', package=10, status='approved')
        self.env = patch.dict(os.environ, {'CREDITS_ENABLED': 'true'})
        self.env.start()
        self.service_patch = patch.object(credit_api, 'service', return_value=self.service)
        self.service_patch.start()
        main.app.dependency_overrides[main.require_firebase_user] = lambda: USER
        self.client = TestClient(main.app)

    def tearDown(self):
        self.service_patch.stop(); self.env.stop()
        main.app.dependency_overrides.clear()

    def test_legacy_endpoint_cannot_bypass_paid_exam(self):
        self.assertEqual(self.client.post('/api/exam/generate-item', json={'slot': SLOT}).status_code, 403)
        self.assertEqual(self.client.post('/api/credits/admin/change', json={
            'uid': 'teacher', 'requestId': 'hack-000001', 'package': 30, 'note': 'hack'}).status_code, 403)

    def test_manual_routes_cannot_bypass_payment_or_replay_ai(self):
        batch = {'prompt': 'Create one biology MCQ question.', 'expectedCount': 1, 'lang': 'vi'}
        self.assertEqual(self.client.post('/api/questions/generate-manual', json=batch).status_code, 403)
        created = self.client.post('/api/credits/manual-runs', json={'requestId':'manual-api-1', 'batches':[batch]})
        self.assertEqual(created.status_code, 200, created.text)
        with patch.object(main, '_generate_manual_questions', return_value=[QUESTION]) as provider:
            for _ in range(2):
                result = self.client.post('/api/questions/generate-manual', json={**batch, 'runId':'manual-api-1', 'batchIndex':0})
                self.assertEqual(result.status_code, 200, result.text)
            self.assertEqual(provider.call_count, 1)
        self.assertEqual(self.client.get('/api/credits/me').json()['manualBalance'], 2)

    def test_teacher_can_request_and_report_payment_but_not_approve_it(self):
        order = self.client.post('/api/credits/purchases', json={'requestId':'purchase-api-1','product':'manual','package':3})
        self.assertEqual(order.status_code, 200, order.text)
        self.assertEqual(self.client.post('/api/credits/purchases/purchase-api-1/report-payment', json={}).status_code, 200)
        self.assertEqual(self.client.get('/api/credits/admin/purchases').status_code, 403)
        self.assertEqual(self.client.post('/api/credits/admin/change', json={'uid':'teacher','requestId':'hack-pay-1','manualPackage':3,'note':'hack','paymentReference':'FORGED'}).status_code, 403)
        self.assertEqual(self.client.get('/api/credits/me').json()['balance'], 10)

    def test_resolved_requests_never_hide_pending_requests(self):
        collection = f'{self.service.namespace}_purchase_inbox'
        for i in range(110):
            self.store.documents[f'{collection}/resolved-{i}'] = {'status':'fulfilled','updatedAt':i+100}
        self.store.documents[f'{collection}/pending'] = {'status':'pending','updatedAt':1}
        self.assertEqual(self.store.list_matching(collection, 'status', 'pending'), [{'status':'pending','updatedAt':1}])

    def test_route_resume_after_lost_response_does_not_call_provider_twice(self):
        created = self.client.post('/api/credits/exams', json={
            'requestId': 'exam-00001', 'blueprint': {'title': 'Đề'}, 'slots': [SLOT]})
        self.assertEqual(created.status_code, 200)
        item = main.GeneratedExamItem(slotId=SLOT['id'], part='mcq', order=1, question=QUESTION)
        with patch.object(main, '_generate', return_value=item) as provider:
            for _ in range(2):
                response = self.client.post('/api/credits/exams/exam-00001/items', json={
                    'slotId': SLOT['id'], 'requestId': 'item-00001'})
                self.assertEqual(response.status_code, 200, response.text)
            self.assertEqual(provider.call_count, 1)
        self.assertEqual(self.client.get('/api/credits/me').json()['held'], 0)

    def test_provider_error_releases_claim_and_preserves_wallet(self):
        self.client.post('/api/credits/exams', json={
            'requestId': 'exam-00001', 'blueprint': {}, 'slots': [SLOT]})
        with patch.object(main, '_generate', side_effect=HTTPException(503, detail='temporary')):
            response = self.client.post('/api/credits/exams/exam-00001/items', json={
                'slotId': SLOT['id'], 'requestId': 'item-00001'})
        self.assertEqual(response.status_code, 503)
        self.assertIsNone(self.service.get_exam(USER, 'exam-00001')['lease'])
        self.assertEqual(self.service.me(USER)['held'], 1)


class FirestoreRetryTests(unittest.TestCase):
    def test_aborted_read_retries_fresh_transaction_without_duplicate_write(self):
        from google.api_core.exceptions import Aborted
        store = FirestoreStore.__new__(FirestoreStore)
        store.firestore = Mock()
        store.firestore.transactional.side_effect = lambda function: function
        store.client = Mock()
        snapshot = Mock(exists=True)
        snapshot.to_dict.return_value = {'balance': 10}
        store.client.document.return_value.get.side_effect = [Aborted('contention'), snapshot]
        def change(tx):
            account = tx.get('accounts/teacher')
            account['balance'] -= 1
            tx.set('accounts/teacher', account)
            return account
        with patch('backend.credit_store.time.sleep'):
            result = store.run(change)
        self.assertEqual(result['balance'], 9)
        self.assertEqual(store.client.transaction.call_count, 2)
        self.assertEqual(store.client.transaction.return_value.set.call_count, 1)


class TrialAndSalesTests(unittest.TestCase):
    def setUp(self):
        self.store = MemoryStore()
        self.service = CreditService(self.store, admins=['admin'])
        self.batch = {'prompt': 'Create one biology MCQ question.', 'expectedCount': 1, 'lang': 'vi'}

    def test_automatic_trials_concurrent_login_and_spent_balance(self):
        with ThreadPoolExecutor(max_workers=8) as pool:
            accounts = list(pool.map(lambda _: self.service.me(USER), range(20)))
        self.assertTrue(all(a['balance'] == 2 and a['manualBalance'] == 3 and a['status'] == 'approved' for a in accounts))
        self.assertEqual(len(self.service.history('teacher')), 1)
        self.service.create(USER, 'trial-exam-1', {}, [SLOT])
        self.assertEqual(self.service.me(USER)['balance'], 1)
        self.assert_code('trial_already_granted', lambda: self.service.admin_change('admin', 'teacher', 'trial-grant-2', trial=True))

    def assert_code(self, code, function):
        with self.assertRaises(HTTPException) as raised:
            function()
        self.assertEqual(raised.exception.detail['code'], code)

    def test_old_one_credit_trial_topped_up_once_and_blocked_account_stays_blocked(self):
        old = CreditService(self.store, admins=['admin'], automatic_trials=False)
        old.me(USER)
        path = self.service.account_path('teacher')
        self.store.documents[path].update(trialGranted=True, balance=0)
        for _ in range(2):
            self.assertEqual(self.service.me(USER)['balance'], 1)
        self.service.admin_change('admin', 'teacher', 'block-owner-1', status='blocked')
        self.assertEqual(self.service.me(USER)['status'], 'blocked')
        self.assert_code('account_not_approved', lambda: self.service.create_manual_run(USER, 'blocked-run-1', [self.batch]))

    def finish_run(self, run_id, index=0):
        claim = self.service.claim_manual(USER, run_id, index, self.batch)
        if 'cached' in claim:
            return claim['cached']
        return self.service.finish_manual(USER, run_id, claim['nonce'], [QUESTION])

    def test_three_free_actions_then_payment_and_retry_does_not_spend_exam_credits(self):
        for i in range(3):
            run_id = f'manual-run-{i}'
            self.service.create_manual_run(USER, run_id, [self.batch, self.batch])
            self.finish_run(run_id, 0)
            self.finish_run(run_id, 0)
            self.finish_run(run_id, 1)
        a = self.service.me(USER)
        self.assertEqual((a['manualBalance'], a['manualHeld'], a['balance']), (0, 0, 2))
        self.assert_code('manual_credits_required', lambda: self.service.create_manual_run(USER, 'manual-run-4', [self.batch]))
        self.service.admin_change('admin', 'teacher', 'manual-pay-1', manual_package=3, payment_reference='BANK-20000')
        self.service.admin_change('admin', 'teacher', 'manual-pay-2', manual_package=3, payment_reference='bank-20000')
        self.assertEqual(self.service.me(USER)['manualBalance'], 3)
        self.assertEqual(self.service.me(USER)['balance'], 2)
        self.assert_code('payment_reference_conflict', lambda: self.service.admin_change('admin', 'teacher', 'exam-pay-1', package=10, payment_reference='BANK-20000'))

    def test_manual_failure_resume_tampering_and_cancel(self):
        run = self.service.create_manual_run(USER, 'manual-run-1', [self.batch])
        claim = self.service.claim_manual(USER, run['id'], 0, self.batch)
        self.service.finish_manual(USER, run['id'], claim['nonce'])
        self.assert_code('request_conflict', lambda: self.service.claim_manual(USER, run['id'], 0, {**self.batch, 'expectedCount': 2}))
        self.assert_code('manual_run_missing', lambda: self.service.get_manual_run({'sub':'other'}, run['id']))
        self.service.cancel_manual(USER, run['id'])
        self.assertEqual(self.service.me(USER)['manualBalance'], 3)
        self.service.create_manual_run(USER, 'manual-run-2', [self.batch, self.batch])
        self.finish_run('manual-run-2')
        self.assert_code('manual_cancel_denied', lambda: self.service.cancel_manual(USER, 'manual-run-2'))
        self.finish_run('manual-run-2', 1)
        self.assertEqual(self.service.me(USER)['manualHeld'], 0)

    def test_purchase_request_reporting_never_grants_and_fulfillment_is_atomic(self):
        order = self.service.request_purchase(USER, 'purchase-001', 'manual', 3)
        self.service.report_payment(USER, order['id'])
        self.assertEqual(self.service.me(USER)['manualBalance'], 3)
        self.assertEqual(len(self.service.purchases('teacher')), 1)
        self.assertEqual(self.service.request_purchase(USER, 'purchase-002', 'manual', 3)['id'], order['id'])
        self.assert_code('purchase_pending', lambda: self.service.request_purchase(USER, 'purchase-003', 'exam', 10))
        self.assert_code('purchase_conflict', lambda: self.service.admin_change('admin', 'teacher', 'fulfill-001', package=10, purchase_id=order['id']))
        for _ in range(2):
            self.service.admin_change('admin', 'teacher', 'fulfill-002', manual_package=3, purchase_id=order['id'], payment_reference='BANK-NEW-001')
        self.assertEqual(self.service.me(USER)['manualBalance'], 6)
        self.assertEqual(self.service.purchases('teacher')[0]['status'], 'fulfilled')
        next_order = self.service.request_purchase(USER, 'purchase-004', 'exam', 10)
        self.service.reject_purchase('admin', 'teacher', next_order['id'], 'Chưa thanh toán')
        self.assertEqual(self.service.me(USER)['balance'], 2)


if __name__ == '__main__':
    unittest.main()
