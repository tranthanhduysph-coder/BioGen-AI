import copy
import os
import unittest
from concurrent.futures import ThreadPoolExecutor
from unittest.mock import patch
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
        self.service = CreditService(self.store, admins=['admin'], clock=lambda: self.now)
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
        self.service = CreditService(self.store, admins=['admin'], clock=lambda: self.now)
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

    def test_manual_quota_is_durable_and_does_not_spend_exam_credit(self):
        self.service.manual_admission(USER, 20)
        self.service = CreditService(self.store, admins=['admin'], clock=lambda: self.now)
        self.assert_code('manual_daily_limit', lambda: self.service.manual_admission(USER, 1))
        self.assertEqual(self.service.me(USER)['balance'], 10)

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
        self.service = CreditService(self.store, admins=['admin'])
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


if __name__ == '__main__':
    unittest.main()
