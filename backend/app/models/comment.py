"""BASS PHONK API - Comment Pydantic models."""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field

from app.models.user import UserMinimal


class CommentCreate(BaseModel):
    """Request body for posting a comment."""

    content: str = Field(..., min_length=1, max_length=1000)


class CommentResponse(BaseModel):
    """Full comment response."""

    id: str
    content: str
    track_id: str
    user: Optional[UserMinimal] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class CommentUpdate(BaseModel):
    """Request body for updating a comment."""

    content: str = Field(..., min_length=1, max_length=1000)
