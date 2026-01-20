from functools import lru_cache
from typing import Literal

from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )

    # App
    app_name: str = "Study Buddy"
    debug: bool = False

    # Storage
    storage_backend: Literal["json", "sqlite", "supabase"] = "json"
    storage_path: str = "./data"

    # Auth
    jwt_secret: str = "change-me-in-production"
    jwt_algorithm: str = "HS256"
    jwt_expiration_hours: int = 24

    @model_validator(mode="after")
    def validate_production_secrets(self) -> "Settings":
        """Reject default secrets in production mode."""
        if not self.debug and self.jwt_secret == "change-me-in-production":
            raise ValueError(
                "JWT_SECRET must be set to a secure value in production (DEBUG=false). "
                "Generate a secure secret with: python -c \"import secrets; print(secrets.token_urlsafe(32))\""
            )
        return self

    # Supabase (optional)
    supabase_url: str | None = None
    supabase_key: str | None = None

    # Email (Mailgun)
    mailgun_api_key: str | None = None
    mailgun_domain: str | None = None

    # SMS (Twilio)
    sms_provider: str | None = None
    twilio_account_sid: str | None = None
    twilio_auth_token: str | None = None
    twilio_phone_number: str | None = None

    # AI
    ai_provider: str = "anthropic"
    anthropic_api_key: str | None = None

    # CORS
    cors_origins: list[str] = ["http://localhost:5173", "http://localhost:3000"]


@lru_cache
def get_settings() -> Settings:
    return Settings()
