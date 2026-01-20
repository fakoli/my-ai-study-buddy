"""Service for managing user-provided API keys."""

from datetime import datetime, timezone
from typing import Literal
from uuid import uuid4

from config import Settings
from logging_config import get_logger
from models.user_api_settings import (
    UserAPISettings,
    UserAPISettingsCreate,
    UserAPISettingsResponse,
    UserAPISettingsValidateResponse,
)
from services.base_service import BaseService
from services.encryption_service import EncryptionService
from storage.base import StorageBackend


logger = get_logger(__name__)


class UserAPISettingsService(BaseService):
    """Service for managing user API key settings.

    Handles encrypted storage and retrieval of user-provided API keys.
    """

    COLLECTION = "user_api_settings"

    def __init__(self, storage: StorageBackend, settings: Settings):
        """Initialize the service.

        Args:
            storage: Storage backend for persistence
            settings: Application settings
        """
        super().__init__(storage)
        self.settings = settings
        self.encryption = EncryptionService(settings)

    async def set_api_key(
        self,
        user_id: str,
        data: UserAPISettingsCreate,
    ) -> UserAPISettingsResponse:
        """Set or update an API key for a user.

        If a key for the same provider already exists, it will be updated.

        Args:
            user_id: ID of the user
            data: The API key data to store

        Returns:
            The created/updated API key settings (without the actual key)
        """
        now = datetime.now(timezone.utc)
        key_hint = self.encryption.get_key_hint(data.api_key)
        encrypted_key = self.encryption.encrypt(data.api_key)

        # Check if key already exists for this provider
        existing = await self._get_by_provider(user_id, data.provider)

        if existing:
            # Update existing key
            updated_data = {
                **existing,
                "encrypted_api_key": encrypted_key,
                "key_hint": key_hint,
                "is_valid": True,  # Reset validity on update
                "updated_at": now.isoformat(),
            }
            await self.storage.update(self.COLLECTION, existing["id"], updated_data)
            logger.info(
                f"Updated API key for provider",
                user_id=user_id,
                provider=data.provider,
            )
            return UserAPISettingsResponse(**updated_data)

        # Create new key
        settings_id = str(uuid4())
        new_data = {
            "id": settings_id,
            "user_id": user_id,
            "provider": data.provider,
            "encrypted_api_key": encrypted_key,
            "key_hint": key_hint,
            "is_valid": True,
            "created_at": now.isoformat(),
            "updated_at": now.isoformat(),
        }
        await self.storage.create(self.COLLECTION, new_data)
        logger.info(
            f"Created new API key for provider",
            user_id=user_id,
            provider=data.provider,
        )
        return UserAPISettingsResponse(**new_data)

    async def get_decrypted_key(
        self,
        user_id: str,
        provider: Literal["anthropic", "gemini"],
    ) -> str | None:
        """Get the decrypted API key for a user and provider.

        Args:
            user_id: ID of the user
            provider: The API provider

        Returns:
            The decrypted API key, or None if not found
        """
        existing = await self._get_by_provider(user_id, provider)
        if not existing:
            return None

        if not existing.get("is_valid", True):
            logger.debug(
                f"API key exists but is marked invalid",
                user_id=user_id,
                provider=provider,
            )
            return None

        return self.encryption.decrypt(existing["encrypted_api_key"])

    async def delete_api_key(
        self,
        user_id: str,
        provider: Literal["anthropic", "gemini"],
    ) -> bool:
        """Delete an API key for a user and provider.

        Args:
            user_id: ID of the user
            provider: The API provider

        Returns:
            True if deleted, False if not found
        """
        existing = await self._get_by_provider(user_id, provider)
        if not existing:
            return False

        await self.storage.delete(self.COLLECTION, existing["id"])
        logger.info(
            f"Deleted API key for provider",
            user_id=user_id,
            provider=provider,
        )
        return True

    async def list_api_keys(self, user_id: str) -> list[UserAPISettingsResponse]:
        """List all API keys for a user (without exposing the actual keys).

        Args:
            user_id: ID of the user

        Returns:
            List of API key settings
        """
        results = await self.storage.list(self.COLLECTION, {"user_id": user_id})
        return [UserAPISettingsResponse(**r) for r in results]

    async def validate_api_key(
        self,
        user_id: str,
        provider: Literal["anthropic", "gemini"],
    ) -> UserAPISettingsValidateResponse:
        """Validate that a stored API key works.

        Args:
            user_id: ID of the user
            provider: The API provider to validate

        Returns:
            Validation result with status and message
        """
        key = await self.get_decrypted_key(user_id, provider)
        if not key:
            return UserAPISettingsValidateResponse(
                provider=provider,
                is_valid=False,
                message="No API key found for this provider",
            )

        # Test the key based on provider
        is_valid = False
        message = ""

        if provider == "anthropic":
            is_valid, message = await self._validate_anthropic_key(key)
        elif provider == "gemini":
            is_valid, message = await self._validate_gemini_key(key)

        # Update validity status in storage
        existing = await self._get_by_provider(user_id, provider)
        if existing and existing.get("is_valid") != is_valid:
            await self.storage.update(
                self.COLLECTION,
                existing["id"],
                {**existing, "is_valid": is_valid, "updated_at": datetime.now(timezone.utc).isoformat()},
            )

        return UserAPISettingsValidateResponse(
            provider=provider,
            is_valid=is_valid,
            message=message,
        )

    async def mark_key_invalid(
        self,
        user_id: str,
        provider: Literal["anthropic", "gemini"],
    ) -> None:
        """Mark an API key as invalid (e.g., after an authentication error).

        Args:
            user_id: ID of the user
            provider: The API provider
        """
        existing = await self._get_by_provider(user_id, provider)
        if existing:
            await self.storage.update(
                self.COLLECTION,
                existing["id"],
                {**existing, "is_valid": False, "updated_at": datetime.now(timezone.utc).isoformat()},
            )
            logger.warning(
                f"Marked API key as invalid",
                user_id=user_id,
                provider=provider,
            )

    async def _get_by_provider(
        self,
        user_id: str,
        provider: Literal["anthropic", "gemini"],
    ) -> dict | None:
        """Get API settings for a user and provider.

        Args:
            user_id: ID of the user
            provider: The API provider

        Returns:
            The settings dict, or None if not found
        """
        results = await self.storage.list(
            self.COLLECTION,
            {"user_id": user_id, "provider": provider},
        )
        return results[0] if results else None

    async def _validate_anthropic_key(self, api_key: str) -> tuple[bool, str]:
        """Validate an Anthropic API key by making a test request.

        Args:
            api_key: The API key to validate

        Returns:
            Tuple of (is_valid, message)
        """
        try:
            import anthropic

            client = anthropic.Anthropic(api_key=api_key)
            # Make a minimal request to validate the key
            # Using a simple message with minimal tokens
            client.messages.create(
                model="claude-sonnet-4-20250514",
                max_tokens=1,
                messages=[{"role": "user", "content": "Hi"}],
            )
            return True, "API key is valid"
        except anthropic.AuthenticationError:
            return False, "Invalid API key"
        except anthropic.RateLimitError:
            return True, "API key is valid (rate limited)"
        except Exception as e:
            logger.error(f"Error validating Anthropic key: {e}")
            return False, f"Validation failed: {str(e)}"

    async def _validate_gemini_key(self, api_key: str) -> tuple[bool, str]:
        """Validate a Gemini API key.

        Args:
            api_key: The API key to validate

        Returns:
            Tuple of (is_valid, message)
        """
        # For Gemini, we can make a simple API call to validate
        # This is a placeholder - implement actual validation when needed
        if len(api_key) > 10:
            return True, "API key format is valid (full validation pending)"
        return False, "API key appears to be invalid"
