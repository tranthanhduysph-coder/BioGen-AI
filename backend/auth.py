import os
from typing import Any

from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from google.auth.transport.requests import Request
from google.oauth2 import id_token

AUTH_REQUIRED = os.getenv('AUTH_REQUIRED', 'false').strip().lower() == 'true'
FIREBASE_PROJECT_ID = os.getenv('FIREBASE_PROJECT_ID', 'biogen-ai').strip()

_bearer = HTTPBearer(auto_error=False)
_request = Request()

def verify_firebase_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer),
) -> dict[str, Any] | None:
    if not AUTH_REQUIRED:
        return None

    if credentials is None or credentials.scheme.lower() != 'bearer':
        raise HTTPException(status_code=401, detail='Firebase ID token is required.')

    token = credentials.credentials.strip()
    if not token:
        raise HTTPException(status_code=401, detail='Firebase ID token is required.')

    try:
        claims = id_token.verify_firebase_token(
            token,
            _request,
            audience=FIREBASE_PROJECT_ID,
        )
    except Exception as exc:
        raise HTTPException(status_code=401, detail='Invalid or expired Firebase ID token.') from exc

    if not claims or not claims.get('sub'):
        raise HTTPException(status_code=401, detail='Invalid Firebase user token.')

    return claims
