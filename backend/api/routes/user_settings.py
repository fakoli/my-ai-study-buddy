"""User settings routes for managing API keys."""

from typing import Literal

from fastapi import APIRouter, Depends

from config import get_settings
from dependencies import get_current_user, get_storage
from models.user import User
from models.user_api_settings import (
    UserAPISettingsCreate,
    UserAPISettingsResponse,
    UserAPISettingsValidateResponse,
)
from services.user_api_settings_service import UserAPISettingsService
from storage.base import StorageBackend


router = APIRouter()


def get_user_api_settings_service(
    storage: StorageBackend = Depends(get_storage),
) -> UserAPISettingsService:
    """Dependency to get the user API settings service."""
    return UserAPISettingsService(storage, get_settings())


@router.get("/api-keys", response_model=list[UserAPISettingsResponse])
async def list_api_keys(
    user: User = Depends(get_current_user),
    service: UserAPISettingsService = Depends(get_user_api_settings_service),
) -> list[UserAPISettingsResponse]:
    """List all configured API keys for the current user.

    Returns only key hints (last 4 characters), not the actual keys.
    """
    return await service.list_api_keys(user.id)


@router.post("/api-keys", response_model=UserAPISettingsResponse)
async def set_api_key(
    data: UserAPISettingsCreate,
    user: User = Depends(get_current_user),
    service: UserAPISettingsService = Depends(get_user_api_settings_service),
) -> UserAPISettingsResponse:
    """Set or update an API key for a provider.

    The API key will be encrypted before storage.
    If a key for the same provider already exists, it will be updated.
    """
    return await service.set_api_key(user.id, data)


@router.delete("/api-keys/{provider}")
async def delete_api_key(
    provider: Literal["anthropic", "gemini"],
    user: User = Depends(get_current_user),
    service: UserAPISettingsService = Depends(get_user_api_settings_service),
) -> dict:
    """Delete an API key for a specific provider."""
    deleted = await service.delete_api_key(user.id, provider)
    if deleted:
        return {"message": f"API key for {provider} deleted successfully"}
    return {"message": f"No API key found for {provider}"}


@router.post("/api-keys/{provider}/validate", response_model=UserAPISettingsValidateResponse)
async def validate_api_key(
    provider: Literal["anthropic", "gemini"],
    user: User = Depends(get_current_user),
    service: UserAPISettingsService = Depends(get_user_api_settings_service),
) -> UserAPISettingsValidateResponse:
    """Validate that a stored API key works.

    Makes a test request to the provider's API to verify the key is valid.
    """
    return await service.validate_api_key(user.id, provider)
