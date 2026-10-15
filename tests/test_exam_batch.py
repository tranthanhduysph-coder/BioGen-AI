import copy
import json
import os
import unittest
from contextlib import ExitStack
from types import SimpleNamespace
from unittest.mock import Mock, patch

from fastapi import HTTPException
from fastapi.testclient import TestClient
from google.genai.errors import ServerError
from backend import main, credit_api
from backend.credits import CreditService
from backend.credit_store import MemoryStore
from backend.exam_batch import build_prompt
from backend.gemini_gateway import GeminiRateLimiter

USER = {'sub': 'teacher', 'email': 'teacher@example.invalid'}
REQUIREMENT = {'contentId': 'bio', 'contentLabel': 'Tiến hóa', 'competencyCode': 'NT1',
               'outcomeId': 'bio-1', 'outcomeText': 'Nêu được khái niệm tiến hóa sinh học.', 'level': 'know'}


def exam_slots():
    result = []
    for part, count in [('mcq', 18), ('tf', 2), ('short', 8)]:
        for order in range(1, count + 1):
            slot = {'id': f'{part}-{order}', 'part': part, 'order': order}
            if part == 'tf':
                slot['statements'] = [{**REQUIREMENT, 'id': f'{slot["id"]}-{n}', 'statementOrder': n} for n in range(1, 5)]
            else:
                slot.update(REQUIREMENT)
            result.append(slot)
    return result


def answer(slot):
    question = {'question': 'Xét quá trình tiến hóa sinh học.', 'explanation': 'Giải thích theo chương trình.'}
    if slot['part'] == 'mcq':
        question.update(options=['A. Một', 'B. Hai', 'C. Ba', 'D. Bốn'], answer='A')
    elif slot['part'] == 'tf':
        question.update(options=['a) Một', 'b) Hai', 'c) Ba', 'd) Bốn'], answer='a) Đúng; b) Sai; c) Đúng; d) Sai')
    else:
        question.update(options=[], answer='12')
    return {'slotId': slot['id'], 'question': question}


class ExamBatchTests(unittest.TestCase):
    def setUp(self):
        self.now = 1000
        self.slots = exam_slots()
        self.service = CreditService(MemoryStore(), admins=['admin'], clock=lambda: self.now, automatic_trials=False)
        self.service.me(USER)
        self.service.admin_change('admin', 'teacher', 'approve-0001', status='approved')
        self.service.admin_change('admin', 'teacher', 'grant-000001', package=10)
        self.service.create(USER, 'exam-000001', {}, self.slots)
        self.provider = Mock()
        self.reply(self.slots)
        self.stack = ExitStack()
        self.addCleanup(self.stack.close)
        self.stack.enter_context(patch.dict(os.environ, {'CREDITS_ENABLED': 'true'}))
        self.stack.enter_context(patch.object(credit_api, 'service', return_value=self.service))
        self.stack.enter_context(patch.object(main, '_client', return_value=self.provider))
        self.limiter = GeminiRateLimiter(100, clock=lambda: self.now)
        self.stack.enter_context(patch.object(main, '_gemini_limiter', self.limiter))
        main._usage_by_uid.clear()
        main.app.dependency_overrides[main.require_firebase_user] = lambda: USER
        self.addCleanup(main.app.dependency_overrides.clear)
        self.client = TestClient(main.app)

    def reply(self, slots, data=None):
        self.provider.models.generate_content.return_value = SimpleNamespace(
            text=json.dumps([answer(s) for s in slots] if data is None else data),
            usage_metadata=SimpleNamespace(prompt_token_count=100, candidates_token_count=200, thoughts_token_count=10))

    def generate(self, slots=None, operation='batch-00001'):
        return self.client.post('/api/credits/exams/exam-000001/generate', json={
            'slotIds': [s['id'] for s in (self.slots if slots is None else slots)], 'requestId': operation})

    def current(self):
        return self.service.get_exam(USER, 'exam-000001')

    def test_complete_mixed_exam_one_provider_call_and_one_credit(self):
        response = self.generate()
        self.assertEqual(response.status_code, 200, response.text)
        self.assertEqual(len(response.json()['items']), 28)
        self.assertEqual(response.json()['failures'], [])
        self.assertEqual(self.provider.models.generate_content.call_count, 1)
        prompt = self.provider.models.generate_content.call_args.kwargs['contents']
        self.assertEqual(prompt.count(REQUIREMENT['outcomeText']), 1)
        self.assertEqual(prompt.count('"slotId"'), 29)  # schema example plus 28 positions
        self.assertEqual(self.current()['status'], 'completed')
        self.assertEqual(self.current()['usage'], {'calls': 1, 'inputTokens': 100, 'outputTokens': 200, 'thinkingTokens': 10})
        account = self.service.me(USER)
        self.assertEqual((account['balance'], account['held']), (9, 0))
        self.assertEqual([e['kind'] for e in self.service.history('teacher')].count('consume'), 1)
        # A lost response or a second tab retrieves persisted questions without calling AI again.
        self.assertEqual(self.generate().json(), response.json())
        self.assertEqual(self.generate(operation='batch-00002').json(), response.json())
        self.assertEqual(self.provider.models.generate_content.call_count, 1)
        self.assertEqual(self.current()['replacedUnits'], 0)

    def test_partial_response_keeps_good_items_and_resumes_missing_in_one_call(self):
        data = [answer(s) for s in self.slots[1:]]  # first missing
        data.append(copy.deepcopy(data[0]))  # second duplicate
        data[2]['question']['answer'] = 'invalid'  # fourth invalid MCQ
        self.reply([], data)
        result = self.generate().json()
        self.assertEqual(len(result['items']), 25)
        self.assertEqual(len(result['failures']), 3)
        self.assertEqual(self.service.me(USER)['held'], 1)
        saved = copy.deepcopy(self.current()['items'])
        replay = self.generate().json()
        self.assertEqual(replay['items'], result['items'])
        self.assertEqual([f['slotId'] for f in replay['failures']], [f['slotId'] for f in result['failures']])
        self.assertEqual(self.provider.models.generate_content.call_count, 1)
        missing = [s for s in self.slots if s['id'] not in saved]
        self.reply(missing)
        response = self.generate(missing, 'batch-00002')
        self.assertEqual(response.status_code, 200, response.text)
        self.assertEqual(self.provider.models.generate_content.call_count, 2)
        self.assertEqual(self.current()['status'], 'completed')
        for key, value in saved.items():
            self.assertEqual(self.current()['items'][key], value)
        self.assertEqual(self.service.me(USER)['balance'], 9)

    def test_legacy_partial_exam_only_sends_23_missing_questions(self):
        for s in self.slots[:5]:
            claim = self.service.claim(USER, 'exam-000001', s['id'], f'legacy-{s["id"]}')
            item = answer(s)
            item.update(part=s['part'], order=s['order'])
            self.service.finish(USER, 'exam-000001', claim['nonce'], item)
        self.reply(self.slots[5:])
        response = self.generate()
        self.assertEqual(response.status_code, 200, response.text)
        self.assertEqual(len(response.json()['items']), 28)
        self.assertEqual(self.provider.models.generate_content.call_count, 1)
        prompt = self.provider.models.generate_content.call_args.kwargs['contents']
        self.assertIn('ALL 23 question positions', prompt)
        self.assertNotIn('"slotId":"mcq-1"', prompt)

    def test_malformed_json_is_not_repaired_with_another_provider_call(self):
        self.provider.models.generate_content.return_value.text = '[truncated'
        response = self.generate()
        self.assertEqual(response.status_code, 422)
        self.assertFalse(response.json()['detail']['retryable'])
        self.assertEqual(self.provider.models.generate_content.call_count, 1)
        self.assertIsNone(self.current()['lease'])
        self.assertEqual(self.service.me(USER)['held'], 1)

    def test_provider_error_is_not_automatically_replayed(self):
        self.provider.models.generate_content.side_effect = ServerError(503, {'message': 'busy'})
        response = self.generate()
        self.assertEqual(response.status_code, 503)
        self.assertFalse(response.json()['detail']['retryable'])
        self.assertEqual(self.provider.models.generate_content.call_count, 1)
        self.assertIsNone(self.current()['lease'])

    def test_local_throttle_is_retryable_without_provider_call_or_hourly_charge(self):
        for _ in range(100):
            self.limiter.reserve()
        response = self.generate()
        self.assertEqual(response.status_code, 429)
        self.assertTrue(response.json()['detail']['retryable'])
        self.provider.models.generate_content.assert_not_called()
        self.assertEqual(len(main._usage_by_uid['teacher']), 0)
        self.assertIsNone(self.current()['lease'])

    def test_foreign_or_forged_positions_cannot_call_provider(self):
        response = self.generate([{'id': 'forged'}])
        self.assertEqual(response.status_code, 422)
        self.service.me({'sub': 'other'})
        self.service.admin_change('admin', 'other', 'approve-other', status='approved')
        main.app.dependency_overrides[main.require_firebase_user] = lambda: {'sub': 'other'}
        self.assertEqual(self.generate().status_code, 404)
        self.provider.models.generate_content.assert_not_called()

    def test_batch_lease_prevents_concurrent_generation_and_stale_saves(self):
        first = self.service.claim_batch(USER, 'exam-000001', [s['id'] for s in self.slots], 'first-00001')
        self.assertEqual(self.generate().json()['detail']['code'], 'exam_busy')
        self.provider.models.generate_content.assert_not_called()
        self.now += 301
        second = self.service.claim_batch(USER, 'exam-000001', [s['id'] for s in self.slots], 'second-00001')
        self.service.release(USER, 'exam-000001', first['nonce'])
        with self.assertRaises(HTTPException):
            self.service.finish_batch(USER, 'exam-000001', first['nonce'], {'items': [], 'failures': []})
        self.assertEqual(self.current()['lease']['nonce'], second['nonce'])

    def test_operation_cannot_be_reused_for_another_subset(self):
        self.assertEqual(self.generate().status_code, 200)
        self.assertEqual(self.generate(self.slots[:1]).json()['detail']['code'], 'request_conflict')
        self.assertEqual(self.provider.models.generate_content.call_count, 1)

    def test_cancelled_exam_cannot_accept_an_inflight_batch_or_consume_credit(self):
        claim = self.service.claim_batch(USER, 'exam-000001', [s['id'] for s in self.slots], 'batch-00001')
        self.now += 301  # A timed-out provider can return after the user cancels.
        self.service.cancel(USER, 'exam-000001')
        with self.assertRaises(HTTPException):
            self.service.finish_batch(USER, 'exam-000001', claim['nonce'], {'items': [], 'failures': []})
        self.assertEqual((self.service.me(USER)['balance'], self.service.me(USER)['held']), (10, 0))

    def test_credit_guard_prevents_bypassing_payment_with_noncredit_route(self):
        response = self.client.post('/api/exam/generate', json={'slots': self.slots})
        self.assertEqual(response.status_code, 403)
        self.provider.models.generate_content.assert_not_called()
        main.app.dependency_overrides.clear()
        self.assertEqual(self.generate().status_code, 401)

    def test_noncredit_route_also_uses_one_call_when_credit_disabled(self):
        with patch.dict(os.environ, {'CREDITS_ENABLED': 'false'}):
            response = self.client.post('/api/exam/generate', json={'slots': self.slots})
        self.assertEqual(response.status_code, 200, response.text)
        self.assertEqual(len(response.json()['items']), 28)
        self.assertEqual(self.provider.models.generate_content.call_count, 1)


if __name__ == '__main__':
    unittest.main()
