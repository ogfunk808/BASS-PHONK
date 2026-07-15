"""BASS PHONK API - Request/response logging middleware.

Logs every incoming request and outgoing response with timing information
for monitoring and debugging.
"""

import logging
import time

from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.requests import Request
from starlette.responses import Response

logger = logging.getLogger("bass_phonk")


class LoggingMiddleware(BaseHTTPMiddleware):
    """Middleware that logs request method, path, status, and duration."""

    async def dispatch(
        self, request: Request, call_next: RequestResponseEndpoint
    ) -> Response:
        start_time = time.perf_counter()

        # Extract client info
        client_ip = request.client.host if request.client else "unknown"
        method = request.method
        path = request.url.path
        query = str(request.url.query) if request.url.query else ""

        logger.info(
            "→ %s %s%s from %s",
            method,
            path,
            f"?{query}" if query else "",
            client_ip,
        )

        try:
            response = await call_next(request)
        except Exception as exc:
            duration_ms = (time.perf_counter() - start_time) * 1000
            logger.error(
                "✗ %s %s — 500 in %.1fms — %s",
                method,
                path,
                duration_ms,
                str(exc),
            )
            raise

        duration_ms = (time.perf_counter() - start_time) * 1000
        status_code = response.status_code

        log_fn = logger.info if status_code < 400 else logger.warning
        if status_code >= 500:
            log_fn = logger.error

        log_fn(
            "← %s %s — %d in %.1fms",
            method,
            path,
            status_code,
            duration_ms,
        )

        # Add timing header for debugging
        response.headers["X-Response-Time"] = f"{duration_ms:.1f}ms"

        return response
