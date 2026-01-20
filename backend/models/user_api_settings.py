"""User API settings models for storing user-provided API keys."""

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


class UserAPISettings(BaseModel):
    """Stored API key settings for a user."""

    id: str
    user_id: str
    provider: Literal["anthropic", "gemini"]
    encrypted_api_key: str
    key_hint: str = Field(
        ...,
        description="Last 4 characters of the API key for display",
    )
    is_valid: bool = True
    created_at: datetime
    updated_at: datetime


class UserAPISettingsResponse(BaseModel):
    """Response model for listing user API keys (without exposing the key)."""

    id: str
    user_id: str
    provider: Literal["anthropic", "gemini"]
    key_hint: str
    is_valid: bool
    created_at: datetime
    updated_at: datetime


class UserAPISettingsCreate(BaseModel):
    """Request model for setting/updating an API key."""

    provider: Literal["anthropic", "gemini"]
    api_key: str = Field(
        ...,
        min_length=10,
        description="The API key to store (will be encrypted)",
    )


class UserAPISettingsValidateResponse(BaseModel):
    """Response model for API key validation."""

    provider: Literal["anthropic", "gemini"]
    is_valid: bool
    message: str
