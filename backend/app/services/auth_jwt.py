"""JWT helpers for app authentication."""
import os
from datetime import datetime, timedelta, timezone
from typing import Any, Dict

import jwt
from fastapi import HTTPException


JWT_ALGORITHM = "HS256"
JWT_EXP_HOURS = int(os.getenv("JWT_EXP_HOURS", "168"))  # 7 days by default


def _get_jwt_secret() -> str:
    secret = os.getenv("JWT_SECRET", "").strip()
    if not secret:
        raise HTTPException(status_code=503, detail="JWT_SECRET is not configured")
    return secret


def create_access_token(payload: Dict[str, Any]) -> str:
    """Create a signed access token with expiration."""
    now = datetime.now(tz=timezone.utc)
    token_payload = {
        **payload,
        "iat": int(now.timestamp()),
        "exp": int((now + timedelta(hours=JWT_EXP_HOURS)).timestamp()),
    }
    return jwt.encode(token_payload, _get_jwt_secret(), algorithm=JWT_ALGORITHM)


def decode_access_token(token: str) -> Dict[str, Any]:
    """Decode and validate a signed access token."""
    try:
        return jwt.decode(token, _get_jwt_secret(), algorithms=[JWT_ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Session expired. Please sign in again.")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid authentication token")
