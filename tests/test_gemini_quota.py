import json
import unittest
from concurrent.futures import ThreadPoolExecutor
from types import SimpleNamespace
from unittest.mock import Mock, patch

import httpx
from fastapi import HTTPException
from fastapi.testclient import TestClient
from google.genai.errors import ClientError, ServerError

from backend import main
from backend.gemini_gateway import GeminiRateLimiter, generate_content


QUESTION = {'question': 'Câu hỏi', 'options': ['A. 1', 'B. 2', 'C. 3', 'D. 4'],
            'answer': 'A', 'explanation': 'Giải thích'}
SLOT = {'id': 'mcq-q01', 'part': 'mcq', 'order': 1, 'contentId': 'test',
        'contentLabel': 'Sinh học', 'competencyCode': 'NT1', 'outcomeId': 'test-1',
        'outcomeText': 'Nêu khái niệm sinh học', 'level': 'know'}
ORIGIN = 'https://biogenai-blueprint-preview.onrender.com'


class QuotaTests(unittest.TestCase):
    def setUp(self):
        self.now = 100.0
        self.limiter = GeminiRateLimiter(4, clock=lambda: self.now)
        self.provider = Mock()
        self.provider.models.generate_content.return_value = SimpleNamespace(text=json.dumps(QUESTION))
        main.app.dependency_overrides[main.require_firebase_user] = lambda: {'sub': 'test-user'}
        main._usage_by_uid.clear()

    def tearDown(self):
        main.app.dependency_overrides.clear()

    def test_shared_limit_is_atomic_for_concurrent_requests(self):
        def call(_):
            try:
                self.limiter.reserve()
                return True
            except HTTPException as exc:
                self.assertEqual(exc.status_code, 429)
                self.assertEqual(exc.headers['Retry-After'], '60')
                return False
        with ThreadPoolExecutor(max_workers=12) as pool:
            self.assertEqual(sum(pool.map(call, range(12))), 4)
        self.now += 60
        self.limiter.reserve()

    def test_rounds_wait_up_and_does_not_charge_denied_admission(self):
        charged = Mock()
        for _ in range(4):
            self.limiter.reserve()
        self.now += 0.1
        with self.assertRaises(HTTPException) as ctx:
            self.limiter.reserve(charged)
        self.assertEqual(ctx.exception.headers['Retry-After'], '60')
        charged.assert_not_called()

    def test_provider_429_is_not_retried_and_defers_all_routes(self):
        self.provider.models.generate_content.side_effect = ClientError(429, {'error': {
            'details': [{'@type': 'type.googleapis.com/google.rpc.RetryInfo', 'retryDelay': '75.2s'}]}})
        with self.assertRaises(HTTPException) as ctx:
            generate_content(self.provider, self.limiter, model='test')
        self.assertEqual(ctx.exception.detail['code'], 'gemini_rate_limit')
        self.assertEqual(ctx.exception.headers['Retry-After'], '76')
        self.assertEqual(self.provider.models.generate_content.call_count, 1)
        with self.assertRaises(HTTPException):
            self.limiter.reserve()

    def test_daily_quota_stops_automatic_retry(self):
        self.provider.models.generate_content.side_effect = ClientError(429, {'error': {'details': [
            {'@type': 'type.googleapis.com/google.rpc.QuotaFailure',
             'violations': [{'quotaId': 'GenerateRequestsPerDayPerProjectPerModel-FreeTier'}]}]}})
        with self.assertRaises(HTTPException) as ctx:
            generate_content(self.provider, self.limiter)
        self.assertEqual(ctx.exception.detail['code'], 'gemini_daily_quota')
        self.assertFalse(ctx.exception.detail['retryable'])
        with self.assertRaises(HTTPException) as cached:
            self.limiter.reserve()
        self.assertEqual(cached.exception.detail['code'], 'gemini_daily_quota')

    def test_network_errors_return_readable_service_error(self):
        self.provider.models.generate_content.side_effect = httpx.ConnectError('connection lost')
        with self.assertRaises(HTTPException) as ctx:
            generate_content(self.provider, self.limiter)
        self.assertEqual(ctx.exception.status_code, 503)
        self.assertEqual(ctx.exception.detail['code'], 'gemini_unavailable')
        self.assertFalse(ctx.exception.detail['retryable'])

    def test_provider_service_error_can_retry_but_does_not_retry_inside_sdk(self):
        self.provider.models.generate_content.side_effect = ServerError(503, {'message': 'busy'})
        with self.assertRaises(HTTPException) as ctx:
            generate_content(self.provider, self.limiter)
        self.assertTrue(ctx.exception.detail['retryable'])
        self.assertEqual(ctx.exception.headers['Retry-After'], '10')
        self.assertEqual(self.provider.models.generate_content.call_count, 1)

    def test_exhausted_project_entitlement_is_terminal(self):
        self.provider.models.generate_content.side_effect = ClientError(429, {'message': 'quota limit: 0'})
        with self.assertRaises(HTTPException) as ctx:
            generate_content(self.provider, self.limiter)
        self.assertFalse(ctx.exception.detail['retryable'])

    def test_sdk_internal_retries_are_disabled(self):
        with patch.object(main, 'GEMINI_API_KEY', 'test-only'), patch.object(main.genai, 'Client') as create:
            main._client()
        self.assertEqual(create.call_args.kwargs['http_options']['retry_options']['attempts'], 1)

    def test_validation_retry_is_metered_and_charges_user_once(self):
        self.provider.models.generate_content.side_effect = [SimpleNamespace(text='{}'),
                                                             SimpleNamespace(text=json.dumps(QUESTION))]
        with patch.object(main, '_client', return_value=self.provider), patch.object(main, '_gemini_limiter', self.limiter):
            response = TestClient(main.app).post('/api/exam/generate-item', json={'slot': SLOT})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(self.limiter.calls), 2)
        self.assertEqual(len(main._usage_by_uid['test-user']), 1)

    def test_both_routes_share_limit_and_cors_exposes_retry_after(self):
        with patch.object(main, '_client', return_value=self.provider), patch.object(main, '_gemini_limiter', self.limiter):
            client = TestClient(main.app)
            for _ in range(4):
                response = client.post('/api/exam/generate-item', json={'slot': SLOT})
                self.assertEqual(response.status_code, 200)
            response = client.post('/api/questions/generate-manual',
                headers={'Origin': ORIGIN}, json={'prompt': 'Tạo một câu hỏi Sinh học.', 'expectedCount': 1})
        self.assertEqual(response.status_code, 429)
        self.assertEqual(response.json()['detail']['code'], 'gemini_rate_limit')
        self.assertEqual(response.headers['access-control-allow-origin'], ORIGIN)
        self.assertEqual(response.headers['access-control-expose-headers'], 'Retry-After')
        self.assertEqual(len(main._usage_by_uid['test-user']), 4)
        self.assertEqual(self.provider.models.generate_content.call_count, 4)

    def test_invalid_question_is_422_not_quota_or_gateway_error(self):
        self.provider.models.generate_content.return_value = SimpleNamespace(text='{}')
        with patch.object(main, '_client', return_value=self.provider), patch.object(main, '_gemini_limiter', self.limiter):
            response = TestClient(main.app).post('/api/exam/generate-item',
                headers={'Origin': ORIGIN}, json={'slot': SLOT})
        self.assertEqual(response.status_code, 422)
        self.assertEqual(response.json()['detail']['code'], 'ai_invalid_question')
        self.assertEqual(response.headers['access-control-allow-origin'], ORIGIN)


if __name__ == '__main__':
    unittest.main()
