"""BASS PHONK API - Authentication dependencies.

Provides the get_current_user FastAPI dependency that extracts and validates
the JWT from the Authorization header using the Supabase Auth session.
"""

from typing import Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.services.supabase_client import get_supabase

security = HTTPBearer(auto_error=False)


async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
) -> dict:
    """Extract and validate the current user from the JWT bearer token.

    Uses the Supabase client to verify the token and fetch the user.

    Args:
        credentials: HTTP Bearer token from the Authorization header.

    Returns:
        dict containing user data from Supabase Auth.

    Raises:
        HTTPException 401: If the token is missing or invalid.
    """
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. Provide a Bearer token.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = credentials.credentials
    sb = get_supabase()

    try:
        user_response = sb.auth.get_user(token)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if user_response is None or user_response.user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user = user_response.user
    return {
        "id": user.id,
        "email": user.email,
        "role": user.role,
        "created_at": str(user.created_at) if user.created_at else None,
    }


async def get_current_user_optional(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
) -> Optional[dict]:
    """Optionally extract the current user. Returns None if no token is provided.

    This is used for endpoints that behave differently when authenticated
    (e.g., showing whether a track is liked by the current user).
    """
    if credentials is None:
        return None

    try:
        return await get_current_user(credentials)
    except HTTPException:
        return None
