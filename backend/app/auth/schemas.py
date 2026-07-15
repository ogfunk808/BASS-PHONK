"""BASS PHONK API - Auth request/response schemas."""

from typing import Optional

from pydantic import BaseModel, EmailStr, Field


class SignupRequest(BaseModel):
    """Signup request body."""

    email: EmailStr
    password: str = Field(..., min_length=8, max_length=128)
    username: str = Field(..., min_length=3, max_length=30, pattern=r"^[a-zA-Z0-9_]+$")
    display_name: Optional[str] = Field(None, max_length=50)


class LoginRequest(BaseModel):
    """Login request body."""

    email: EmailStr
    password: str


class AuthResponse(BaseModel):
    """Authentication response with tokens."""

    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int
    user_id: str
    email: str
    username: Optional[str] = None


class RefreshRequest(BaseModel):
    """Token refresh request body."""

    refresh_token: str


class OAuthRequest(BaseModel):
    """OAuth redirect request body."""

    access_token: str
    refresh_token: Optional[str] = None


class PasswordResetRequest(BaseModel):
    """Password reset request body."""

    email: EmailStr


class TokenData(BaseModel):
    """Decoded JWT token data."""

    sub: str  # user id
    email: Optional[str] = None
    exp: Optional[int] = None
