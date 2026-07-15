"""BASS PHONK API - Track Pydantic models."""

from datetime import datetime
from typing import Optional, List
from enum import Enum

from pydantic import BaseModel, Field

from app.models.user import UserMinimal


class Genre(str, Enum):
    """Supported phonk sub-genres."""

    BRAZILIAN = "brazilian"
    DRIFT = "drift"
    MEMPHIS = "memphis"
    COWBELL = "cowbell"
    DARK = "dark"
    HOUSE = "house"
    AGGRESSIVE = "aggressive"
    CLASSIC = "classic"


class TrackCreate(BaseModel):
    """Request body for creating / uploading a new track."""

    title: str = Field(..., min_length=1, max_length=200)
    artist_name: str = Field(..., min_length=1, max_length=100)
    genre: Genre
    description: Optional[str] = Field(None, max_length=1000)
    bpm: Optional[int] = Field(None, ge=60, le=300)
    tags: List[str] = Field(default_factory=list, max_length=10)
    is_free_download: bool = False


class TrackUpdate(BaseModel):
    """Request body for updating a track."""

    title: Optional[str] = Field(None, min_length=1, max_length=200)
    genre: Optional[Genre] = None
    description: Optional[str] = Field(None, max_length=1000)
    bpm: Optional[int] = Field(None, ge=60, le=300)
    tags: Optional[List[str]] = None
    is_free_download: Optional[bool] = None


class TrackResponse(BaseModel):
    """Full track response model."""

    id: str
    title: str
    artist_name: str
    artist_id: str
    genre: str
    description: Optional[str] = None
    audio_url: str
    artwork_url: Optional[str] = None
    duration_seconds: Optional[float] = None
    bpm: Optional[int] = None
    bitrate_kbps: Optional[int] = None
    format: Optional[str] = None
    tags: List[str] = Field(default_factory=list)
    plays_count: int = 0
    likes_count: int = 0
    downloads_count: int = 0
    comments_count: int = 0
    is_free_download: bool = False
    is_liked: bool = False
    artist: Optional[UserMinimal] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class TrackMinimal(BaseModel):
    """Minimal track info for lists and embeds."""

    id: str
    title: str
    artist_name: str
    genre: str
    audio_url: str
    artwork_url: Optional[str] = None
    duration_seconds: Optional[float] = None
    plays_count: int = 0
    likes_count: int = 0


class GenreInfo(BaseModel):
    """Genre with track count."""

    name: str
    slug: str
    count: int
    description: Optional[str] = None
