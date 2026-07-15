"""BASS PHONK API - Common Pydantic models.

Shared models for pagination, error responses, and standard API wrappers.
"""

from typing import Generic, List, Optional, TypeVar

from pydantic import BaseModel, Field

T = TypeVar("T")


class ErrorResponse(BaseModel):
    """Standard error response body."""

    detail: str
    status_code: int = 400


class SuccessResponse(BaseModel):
    """Generic success response."""

    message: str
    success: bool = True


class PaginatedResponse(BaseModel, Generic[T]):
    """Paginated list response wrapper."""

    items: List[T] = Field(default_factory=list)  # type: ignore[assignment]
    page: int = 1
    per_page: int = 20
    total: int = 0
    total_pages: int = 0


class PaginationParams(BaseModel):
    """Query parameters for pagination."""

    page: int = Field(default=1, ge=1, description="Page number (1-indexed)")
    per_page: int = Field(default=20, ge=1, le=100, description="Items per page")

    @property
    def offset(self) -> int:
        return (self.page - 1) * self.per_page


class HealthResponse(BaseModel):
    """Health check response."""

    status: str = "ok"
    environment: str
    version: str = "1.0.0"
