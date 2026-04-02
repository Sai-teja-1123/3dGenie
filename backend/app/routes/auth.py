"""Authentication endpoints."""
import os
from typing import Optional

from fastapi import APIRouter, HTTPException, Header
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token
from pydantic import BaseModel, Field
from app.services.auth_jwt import create_access_token, decode_access_token


router = APIRouter(prefix="/api/auth", tags=["auth"])


class GoogleAuthRequest(BaseModel):
    """Request payload for Google sign-in."""
    id_token: str = Field(..., min_length=1)


class AuthUser(BaseModel):
    """Authenticated user info returned to frontend."""
    id: str
    email: str
    name: str
    picture: Optional[str] = None


class GoogleAuthResponse(BaseModel):
    """Response for successful Google sign-in."""
    token: str
    user: AuthUser


class GoogleClientConfigResponse(BaseModel):
    """Public Google OAuth client configuration."""
    client_id: str


class AuthMeResponse(BaseModel):
    """Authenticated session info."""
    user: AuthUser


@router.get("/google/config", response_model=GoogleClientConfigResponse)
async def get_google_client_config():
    """Return the configured Google OAuth client ID for frontend bootstrap."""
    client_id = os.getenv("GOOGLE_CLIENT_ID", "").strip()
    if not client_id:
        raise HTTPException(status_code=503, detail="GOOGLE_CLIENT_ID is not configured")
    return GoogleClientConfigResponse(client_id=client_id)


@router.post("/google", response_model=GoogleAuthResponse)
async def google_sign_in(payload: GoogleAuthRequest):
    """Verify Google ID token and return app auth payload."""
    client_id = os.getenv("GOOGLE_CLIENT_ID", "").strip()
    if not client_id:
        raise HTTPException(status_code=503, detail="GOOGLE_CLIENT_ID is not configured")

    try:
        token_info = id_token.verify_oauth2_token(
            payload.id_token,
            google_requests.Request(),
            client_id,
            clock_skew_in_seconds=10,
        )
    except Exception as exc:
        import logging
        logging.error("Google token verification failed: %s | client_id used: %s", exc, client_id[:20] + "...")
        raise HTTPException(
            status_code=401,
            detail=f"Invalid Google ID token: {exc}"
        )

    email = token_info.get("email")
    email_verified = token_info.get("email_verified", False)
    google_sub = token_info.get("sub")
    name = token_info.get("name") or (email.split("@")[0] if email else "User")
    picture = token_info.get("picture")

    if not email or not google_sub:
        raise HTTPException(status_code=400, detail="Google token missing required identity fields")
    if not email_verified:
        raise HTTPException(status_code=403, detail="Google account email is not verified")

    app_token = create_access_token({
        "sub": google_sub,
        "email": email,
        "name": name,
        "picture": picture,
        "provider": "google",
    })

    return GoogleAuthResponse(
        token=app_token,
        user=AuthUser(
            id=google_sub,
            email=email,
            name=name,
            picture=picture,
        ),
    )


class DemoAuthRequest(BaseModel):
    """Request payload for demo email/password sign-in."""
    email: str = Field(..., min_length=1)
    password: str = Field(..., min_length=1)


@router.post("/demo", response_model=GoogleAuthResponse)
async def demo_sign_in(payload: DemoAuthRequest):
    """Demo sign-in that issues a real JWT for any email/password combo."""
    email = payload.email.strip()
    name = email.split("@")[0] if "@" in email else email
    demo_sub = f"demo-{email}"

    app_token = create_access_token({
        "sub": demo_sub,
        "email": email,
        "name": name,
        "picture": None,
        "provider": "demo",
    })

    return GoogleAuthResponse(
        token=app_token,
        user=AuthUser(
            id=demo_sub,
            email=email,
            name=name,
            picture=None,
        ),
    )


@router.get("/me", response_model=AuthMeResponse)
async def auth_me(authorization: str | None = Header(None)):
    """Validate JWT and return current user profile."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing bearer token")

    token = authorization[7:]
    payload = decode_access_token(token)

    user_id = str(payload.get("sub") or "").strip()
    email = str(payload.get("email") or "").strip()
    name = str(payload.get("name") or "").strip() or (email.split("@")[0] if email else "User")
    picture = payload.get("picture")

    if not user_id or not email:
        raise HTTPException(status_code=401, detail="Invalid authentication token")

    return AuthMeResponse(
        user=AuthUser(
            id=user_id,
            email=email,
            name=name,
            picture=picture,
        )
    )
