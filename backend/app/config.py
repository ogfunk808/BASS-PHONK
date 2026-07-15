"""BASS PHONK API - Configuration settings loaded from environment variables."""

from typing import List

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings sourced from .env file."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # Supabase
    SUPABASE_URL: str
    SUPABASE_ANON_KEY: str
    SUPABASE_SERVICE_KEY: str

    # JWT
    JWT_SECRET: str
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRY_MINUTES: int = 60

    # CORS
    ALLOWED_ORIGINS: str = "http://localhost:5173,http://localhost:3000"

    # API
    API_KEY: str = ""
    ENVIRONMENT: str = "development"
    DEBUG: bool = True

    # Rate limiting
    RATE_LIMIT: str = "100/minute"

    # Server
    PORT: int = 8000
    HOST: str = "0.0.0.0"

    # Upload limits (bytes)
    MAX_AUDIO_SIZE: int = 50 * 1024 * 1024  # 50 MB
    MAX_IMAGE_SIZE: int = 10 * 1024 * 1024  # 10 MB

    @property
    def allowed_origins_list(self) -> List[str]:
        """Parse comma-separated origins into a list."""
        return [origin.strip() for origin in self.ALLOWED_ORIGINS.split(",")]

    @property
    def is_production(self) -> bool:
        return self.ENVIRONMENT == "production"


settings = Settings()  # type: ignore[call-arg]
