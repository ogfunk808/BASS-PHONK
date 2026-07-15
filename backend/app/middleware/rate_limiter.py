"""BASS PHONK API - Rate limiting middleware using slowapi."""

from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address
from starlette.requests import Request

from app.config import settings

limiter = Limiter(
    key_func=get_remote_address,
    default_limits=[settings.RATE_LIMIT],
    storage_uri="memory://",
)


def get_rate_limit_exceeded_handler():
    """Return the rate-limit-exceeded handler for FastAPI."""
    return _rate_limit_exceeded_handler


def auth_rate_limit(request: Request) -> str:
    """Stricter rate limit key for auth endpoints: 10/minute."""
    return get_remote_address(request)
