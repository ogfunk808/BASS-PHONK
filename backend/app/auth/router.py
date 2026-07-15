"""BASS PHONK API - Auth routes.

Handles signup, login, logout, token refresh, OAuth, and password reset
via Supabase Auth.
"""

from fastapi import APIRouter, Depends, HTTPException, status

from app.auth.dependencies import get_current_user
from app.auth.schemas import (
    AuthResponse,
    LoginRequest,
    OAuthRequest,
    PasswordResetRequest,
    RefreshRequest,
    SignupRequest,
)
from app.models.common import SuccessResponse
from app.models.user import UserProfile
from app.services.supabase_client import get_supabase, get_supabase_admin

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/signup", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
async def signup(body: SignupRequest):
    """Register a new user with email and password.

    Creates the Supabase Auth user and a corresponding profile row in the
    'profiles' table.
    """
    sb = get_supabase()
    sb_admin = get_supabase_admin()

    # Check if username is already taken
    existing = (
        sb_admin.table("profiles")
        .select("id")
        .eq("username", body.username)
        .execute()
    )
    if existing.data:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Username is already taken.",
        )

    # Create auth user
    try:
        auth_response = sb.auth.sign_up(
            {
                "email": body.email,
                "password": body.password,
            }
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Signup failed: {exc}",
        )

    if auth_response.user is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Signup failed. The email may already be registered.",
        )

    user_id = auth_response.user.id

    # Create profile row
    try:
        sb_admin.table("profiles").insert(
            {
                "id": user_id,
                "username": body.username,
                "display_name": body.display_name or body.username,
                "email": body.email,
            }
        ).execute()
    except Exception as exc:
        # Attempt to clean up the auth user if profile creation fails
        try:
            sb_admin.auth.admin.delete_user(user_id)
        except Exception:
            pass
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create user profile: {exc}",
        )

    session = auth_response.session
    if session is None:
        raise HTTPException(
            status_code=status.HTTP_201_CREATED,
            detail="Account created. Please check your email to confirm.",
        )

    return AuthResponse(
        access_token=session.access_token,
        refresh_token=session.refresh_token,
        expires_in=session.expires_in or 3600,
        user_id=user_id,
        email=body.email,
        username=body.username,
    )


@router.post("/login", response_model=AuthResponse)
async def login(body: LoginRequest):
    """Authenticate with email and password, returning JWT tokens."""
    sb = get_supabase()

    try:
        auth_response = sb.auth.sign_in_with_password(
            {"email": body.email, "password": body.password}
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
        )

    if auth_response.session is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
        )

    session = auth_response.session
    user = auth_response.user

    # Fetch username from profile
    username = None
    if user:
        sb_admin = get_supabase_admin()
        profile = (
            sb_admin.table("profiles")
            .select("username")
            .eq("id", user.id)
            .single()
            .execute()
        )
        if profile.data:
            username = profile.data.get("username")

    return AuthResponse(
        access_token=session.access_token,
        refresh_token=session.refresh_token,
        expires_in=session.expires_in or 3600,
        user_id=user.id if user else "",
        email=body.email,
        username=username,
    )


@router.post("/logout", response_model=SuccessResponse)
async def logout(current_user: dict = Depends(get_current_user)):
    """Sign out the current user and invalidate the session."""
    sb = get_supabase()

    try:
        sb.auth.sign_out()
    except Exception:
        pass  # Sign out is best-effort

    return SuccessResponse(message="Logged out successfully.")


@router.get("/me", response_model=UserProfile)
async def get_me(current_user: dict = Depends(get_current_user)):
    """Retrieve the authenticated user's profile."""
    sb = get_supabase_admin()

    result = (
        sb.table("profiles")
        .select("*, followers:follows!follows_following_id_fkey(count), following:follows!follows_follower_id_fkey(count)")
        .eq("id", current_user["id"])
        .single()
        .execute()
    )

    if not result.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found.",
        )

    data = result.data
    followers_count = 0
    following_count = 0
    if isinstance(data.get("followers"), list) and data["followers"]:
        followers_count = data["followers"][0].get("count", 0)
    if isinstance(data.get("following"), list) and data["following"]:
        following_count = data["following"][0].get("count", 0)

    # Count user's tracks
    tracks_result = (
        sb.table("tracks")
        .select("id", count="exact")
        .eq("artist_id", current_user["id"])
        .execute()
    )

    return UserProfile(
        id=data["id"],
        username=data.get("username", ""),
        display_name=data.get("display_name"),
        avatar_url=data.get("avatar_url"),
        bio=data.get("bio"),
        is_artist=data.get("is_artist", False),
        is_premium=data.get("is_premium", False),
        followers_count=followers_count,
        following_count=following_count,
        tracks_count=tracks_result.count or 0,
        badges=data.get("badges", []) or [],
        created_at=data.get("created_at"),
    )


@router.post("/refresh", response_model=AuthResponse)
async def refresh_token(body: RefreshRequest):
    """Refresh an expired access token using a refresh token."""
    sb = get_supabase()

    try:
        auth_response = sb.auth.refresh_session(body.refresh_token)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token.",
        )

    session = auth_response.session
    if session is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Failed to refresh session.",
        )

    user = auth_response.user
    return AuthResponse(
        access_token=session.access_token,
        refresh_token=session.refresh_token,
        expires_in=session.expires_in or 3600,
        user_id=user.id if user else "",
        email=user.email if user else "",
    )


@router.post("/oauth/google", response_model=AuthResponse)
async def google_oauth(body: OAuthRequest):
    """Exchange a Google OAuth token for a Supabase session.

    The frontend handles the Google sign-in flow and passes the
    access token to this endpoint.
    """
    sb = get_supabase()

    try:
        # Use the Supabase admin client to get user from the OAuth token
        sb_admin = get_supabase_admin()
        user_response = sb_admin.auth.get_user(body.access_token)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Google OAuth token.",
        )

    if user_response is None or user_response.user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not verify Google OAuth token.",
        )

    user = user_response.user

    # Ensure profile exists
    sb_admin = get_supabase_admin()
    profile = (
        sb_admin.table("profiles")
        .select("id")
        .eq("id", user.id)
        .execute()
    )
    if not profile.data:
        username = (user.email or "").split("@")[0].replace(".", "_")
        sb_admin.table("profiles").insert(
            {
                "id": user.id,
                "username": username,
                "display_name": username,
                "email": user.email,
            }
        ).execute()

    return AuthResponse(
        access_token=body.access_token,
        refresh_token=body.refresh_token or "",
        expires_in=3600,
        user_id=user.id,
        email=user.email or "",
    )


@router.post("/reset-password", response_model=SuccessResponse)
async def reset_password(body: PasswordResetRequest):
    """Send a password reset email to the user."""
    sb = get_supabase()

    try:
        sb.auth.reset_password_email(body.email)
    except Exception:
        pass  # Don't reveal whether the email exists

    return SuccessResponse(
        message="If an account exists with that email, a password reset link has been sent."
    )
