"""BASS PHONK API - Security headers middleware.

Adds security headers (HSTS, CSP, X-Content-Type-Options, X-Frame-Options,
Referrer-Policy, Permissions-Policy) to all responses.
"""

from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.requests import Request
from starlette.responses import Response

from app.config import settings


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Middleware that attaches security headers to every response."""

    async def dispatch(
        self, request: Request, call_next: RequestResponseEndpoint
    ) -> Response:
        response = await call_next(request)

        # Strict Transport Security (1 year, include subdomains)
        if settings.is_production:
            response.headers["Strict-Transport-Security"] = (
                "max-age=31536000; includeSubDomains; preload"
            )

        # Content Security Policy
        response.headers["Content-Security-Policy"] = (
            "default-src 'self'; "
            "script-src 'self'; "
            "style-src 'self' 'unsafe-inline'; "
            "img-src 'self' data: https:; "
            "font-src 'self' https:; "
            "media-src 'self' https:; "
            "connect-src 'self' https:; "
            "frame-ancestors 'none'"
        )

        # Prevent MIME-type sniffing
        response.headers["X-Content-Type-Options"] = "nosniff"

        # Prevent clickjacking
        response.headers["X-Frame-Options"] = "DENY"

        # Referrer policy
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"

        # Permissions policy
        response.headers["Permissions-Policy"] = (
            "camera=(), microphone=(), geolocation=(), payment=()"
        )

        # Remove server header
        response.headers.pop("server", None)

        return response
