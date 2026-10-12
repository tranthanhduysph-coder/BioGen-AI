"""Gemini admission control shared by both generation routes in one API worker."""
import logging
import math
import threading
import time
from collections import deque
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo
import httpx

from fastapi import HTTPException
from google.genai.errors import APIError

logger = logging.getLogger(__name__)


def quota_error(code: str, seconds: int, retryable: bool, message: str) -> HTTPException:
    return HTTPException(
        status_code=429,
        detail={"code": code, "message": message, "retryAfterSeconds": seconds, "retryable": retryable},
        headers={"Retry-After": str(seconds)},
    )


class GeminiRateLimiter:
    def __init__(self, requests_per_minute: int = 4, clock=time.monotonic):
        self.limit = max(1, requests_per_minute)
        self.clock = clock
        self.calls = deque()
        self.lock = threading.Lock()
        self.blocked_until = 0.0
        self.blocked_code = "gemini_rate_limit"
        self.blocked_retryable = True

    def reserve(self, on_admitted=None):
        with self.lock:
            now = self.clock()
            if now < self.blocked_until:
                raise quota_error(self.blocked_code, math.ceil(self.blocked_until - now),
                                  self.blocked_retryable, "Gemini quota reached.")
            while self.calls and self.calls[0] <= now - 60:
                self.calls.popleft()
            if len(self.calls) >= self.limit:
                seconds = max(1, math.ceil(self.calls[0] + 60 - now))
                raise quota_error("gemini_rate_limit", seconds, True,
                                  "Waiting for the project Gemini request limit.")
            if on_admitted is not None:
                on_admitted()
            self.calls.append(now)

    def defer(self, seconds: int, code: str, retryable: bool):
        with self.lock:
            until = self.clock() + seconds
            if until > self.blocked_until:
                self.blocked_until = until
                self.blocked_code = code
                self.blocked_retryable = retryable


def _seconds_to_daily_reset() -> int:
    now = datetime.now(ZoneInfo("America/Los_Angeles"))
    reset = (now + timedelta(days=1)).replace(hour=0, minute=0, second=0, microsecond=0)
    return max(1, math.ceil(reset.timestamp() - now.timestamp()))


def _provider_quota(exc: APIError):
    payload = exc.details if isinstance(exc.details, dict) else {}
    error = payload.get("error", payload)
    details = error.get("details", []) if isinstance(error, dict) else []
    seconds = 60
    daily = False
    for detail in details:
        if not isinstance(detail, dict):
            continue
        if str(detail.get("@type", "")).endswith("RetryInfo"):
            delay = detail.get("retryDelay", "")
            try:
                seconds = max(seconds, math.ceil(float(str(delay).removesuffix("s"))))
            except (ValueError, TypeError, OverflowError):
                pass
        for violation in detail.get("violations", []):
            quota_id = str(violation.get("quotaId", "")) + str(violation.get("quotaMetric", ""))
            compact = quota_id.lower().replace("_", "")
            daily = daily or "perday" in compact
    if daily:
        return "gemini_daily_quota", _seconds_to_daily_reset(), False
    # A project with no entitlement cannot be unblocked by a short retry.
    if "limit: 0" in str(exc.message).lower():
        return "gemini_quota_unavailable", 3600, False
    return "gemini_rate_limit", seconds, True


def generate_content(client, limiter: GeminiRateLimiter, on_admitted=None, **kwargs):
    # Reserve every provider call, including a retry for malformed question JSON.
    limiter.reserve(on_admitted)
    try:
        return client.models.generate_content(**kwargs)
    except APIError as exc:
        # Log status only: SDK messages can contain request/credential details.
        logger.warning("Gemini provider error status=%s", exc.code)
        if exc.code == 429:
            code, seconds, retryable = _provider_quota(exc)
            limiter.defer(seconds, code, retryable)
            raise quota_error(code, seconds, retryable, "Gemini quota reached.") from exc
        if exc.code in (400, 401, 403, 404):
            raise HTTPException(status_code=503, detail={
                "code": "gemini_configuration", "retryable": False,
                "message": "Gemini key, model or project access needs to be checked.",
            }) from exc
        raise HTTPException(status_code=503, detail={
            "code": "gemini_unavailable", "retryable": False,
            "message": "Gemini is temporarily unavailable. Retry later.",
        }) from exc
    except httpx.RequestError as exc:
        logger.warning("Gemini provider transport error type=%s", type(exc).__name__)
        raise HTTPException(status_code=503, detail={
            "code": "gemini_unavailable", "retryable": False,
            "message": "Connection to Gemini failed. Retry later.",
        }) from exc
