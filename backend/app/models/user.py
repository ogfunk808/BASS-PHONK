"""BASS PHONK API - User / Profile Pydantic models."""

from datetime import datetime
from typing import Optional, List

from pydantic import BaseModel, EmailStr, Field


class UserCreate(BaseModel):
    """Request body for user signup."""

    email: EmailStr
    password: str = Field(..., min_length=8, max_length=128)
    username: str = Field(..., min_length=3, max_length=30, pattern=r"^[a-zA-Z0-9_]+$")
    display_name: Optional[str] = Field(None, max_length=50)


class UserLogin(BaseModel):
    """Request body for user login."""

    email: EmailStr
    password: str


class UserProfile(BaseModel):
    """Public user profile response."""

    id: str
    username: str
    display_name: Optional[str] = None
    avatar_url: Optional[str] = None
    bio: Optional[str] = None
    is_artist: bool = False
    is_premium: bool = False
    followers_count: int = 0
    following_count: int = 0
    tracks_count: int = 0
    badges: List[str] = Field(default_factory=list)
    created_at: Optional[datetime] = None


class UserProfileUpdate(BaseModel):
    """Request body for profile update."""

    display_name: Optional[str] = Field(None, max_length=50)
    bio: Optional[str] = Field(None, max_length=500)
    avatar_url: Optional[str] = None


class UserMinimal(BaseModel):
    """Minimal user info for embedding in other responses."""

    id: str
    username: str
    display_name: Optional[str] = None
    avatar_url: Optional[str] = None


class FollowResponse(BaseModel):
    """Response for follow/unfollow actions."""

    followed: bool
    followers_count: int


class LeaderboardEntry(BaseModel):
    """Single entry in the weekly leaderboard."""

    rank: int
    user: UserMinimal
    score: int
    tracks_uploaded: int = 0
    likes_received: int = 0


class BadgeResponse(BaseModel):
    """Badge metadata."""

    id: str
    name: str
    description: str
    icon_url: Optional[str] = None


class ActivityFeedItem(BaseModel):
    """Single item in the activity feed."""

    id: str
    type: str  # "upload", "like", "follow", "comment"
    actor: UserMinimal
    target_id: Optional[str] = None
    target_type: Optional[str] = None
    target_title: Optional[str] = None
    created_at: datetime
