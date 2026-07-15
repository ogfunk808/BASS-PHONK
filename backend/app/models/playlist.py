"""BASS PHONK API - Playlist Pydantic models."""

from datetime import datetime
from typing import Optional, List

from pydantic import BaseModel, Field

from app.models.track import TrackMinimal
from app.models.user import UserMinimal


class PlaylistCreate(BaseModel):
    """Request body for creating a playlist."""

    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    is_public: bool = True
    cover_url: Optional[str] = None


class PlaylistUpdate(BaseModel):
    """Request body for updating a playlist."""

    name: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    is_public: Optional[bool] = None
    cover_url: Optional[str] = None


class PlaylistResponse(BaseModel):
    """Full playlist response."""

    id: str
    name: str
    description: Optional[str] = None
    cover_url: Optional[str] = None
    is_public: bool = True
    is_curated: bool = False
    owner: Optional[UserMinimal] = None
    tracks_count: int = 0
    total_duration_seconds: float = 0.0
    tracks: List[TrackMinimal] = Field(default_factory=list)
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class PlaylistMinimal(BaseModel):
    """Minimal playlist info for lists."""

    id: str
    name: str
    cover_url: Optional[str] = None
    tracks_count: int = 0
    is_curated: bool = False


class PlaylistTrackAdd(BaseModel):
    """Request body for adding a track to a playlist."""

    track_id: str
    position: Optional[int] = None
