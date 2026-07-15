import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

from app.config import settings
from app.auth.router import router as auth_router
from app.routes.tracks import router as tracks_router
from app.services.supabase_client import close_supabase

# Configure logging
logging.basicConfig(level=logging.INFO if settings.DEBUG else logging.WARNING)
logger = logging.getLogger("bass_phonk")

# Configure Rate Limiter
limiter = Limiter(key_func=get_remote_address, default_limits=[settings.RATE_LIMIT])

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifecycle events for FastAPI application."""
    logger.info("Starting BASS PHONK API Server")
    yield
    logger.info("Shutting down BASS PHONK API Server")
    close_supabase()

app = FastAPI(
    title="BASS PHONK API",
    description="The complete backend API for the BASS PHONK music ecosystem",
    version="1.0.0",
    docs_url="/docs" if not settings.is_production else None,
    redoc_url="/redoc" if not settings.is_production else None,
    lifespan=lifespan,
)

# Register rate limit handler
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS Middleware Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins_list,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["*"],
)

# Custom Security Headers Middleware
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    """Add production-ready security headers to all responses."""
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Content-Security-Policy"] = "default-src 'self'; frame-ancestors 'none';"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    
    if settings.is_production:
        # Enforce HSTS for 1 year
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains; preload"
        
    return response

# Root endpoint & health check
@app.get("/", tags=["Health"])
async def root():
    return {
        "app": "BASS PHONK API",
        "status": "online",
        "version": "1.0.0",
        "environment": settings.ENVIRONMENT
    }

@app.get("/api/v1/health", tags=["Health"])
async def health_check():
    return {
        "status": "healthy",
        "database": "connected"
    }

# Register Routers
app.include_router(auth_router, prefix="/api/v1")
app.include_router(tracks_router, prefix="/api/v1")

# Global Exception Handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Global unhandled exception: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "An internal server error occurred. Please try again later."}
    )
