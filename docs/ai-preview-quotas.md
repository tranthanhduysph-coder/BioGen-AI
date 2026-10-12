# AI requests on the blueprint preview

`GEMINI_REQUESTS_PER_MINUTE` defaults to 4, leaving headroom below the current
Gemini project's 5 RPM free quota. Both generation routes share one rolling
60-second window. Every provider attempt, including output-validation retries,
uses that window. SDK retries are disabled; their calls would otherwise bypass
the limiter. Local admission denials do not consume the account's hourly quota.

The limiter uses process memory, matching the preview's current single instance
and single Uvicorn worker. Additional workers, instances, or external apps using
the same Gemini project require a shared limiter. Restarting resets the local
window; the provider's limits still apply and provider 429 responses set a shared
cooldown. This does not increase Gemini's daily quota.

The frontend sends exam requests sequentially. Only explicit temporary quota
responses are retried, at most three times, after `Retry-After` plus one second.
Daily quota, account quota, credential/configuration and connection failures
stop new batch requests and preserve already generated items. Structural AI
output failures return 422 and leave only the affected slot missing. Existing
draft recovery and retry-missing actions remain in use.

The backend returns a structured error `detail` with `code`, `message`,
`retryable`, and (for quota errors) `retryAfterSeconds`. CORS exposes `Retry-After`.
Provider logs contain status codes only; prompts, credentials and raw SDK
exception messages are not logged.

Validation (mock provider, no real API key):

```sh
python -m unittest discover -s tests -p test_gemini_quota.py -v
node tests/aiGeneration.test.mjs
node tests/biologySpecification.test.mjs
```
