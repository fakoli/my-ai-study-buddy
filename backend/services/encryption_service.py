"""Encryption service for secure storage of sensitive data like API keys."""

import base64
import hashlib

from cryptography.fernet import Fernet, InvalidToken

from config import Settings
from exceptions import StudyBuddyException


class EncryptionError(StudyBuddyException):
    """Raised when encryption or decryption fails."""

    def __init__(self, message: str = "Encryption error"):
        super().__init__(message, status_code=500)


class EncryptionService:
    """Service for encrypting and decrypting sensitive data.

    Uses Fernet symmetric encryption (AES-128-CBC with HMAC).
    The encryption key is derived from the JWT_SECRET or a dedicated ENCRYPTION_KEY.
    """

    def __init__(self, settings: Settings):
        """Initialize the encryption service.

        Args:
            settings: Application settings containing the encryption key source
        """
        self._fernet = self._create_fernet(settings)

    def _create_fernet(self, settings: Settings) -> Fernet:
        """Create a Fernet instance from the secret key.

        Derives a 32-byte key from JWT_SECRET using SHA-256,
        then encodes it as URL-safe base64 for Fernet.
        """
        # Use JWT_SECRET as the source for encryption key
        # In production, consider using a dedicated ENCRYPTION_KEY
        secret = settings.jwt_secret

        # Derive a 32-byte key using SHA-256
        key_bytes = hashlib.sha256(secret.encode()).digest()

        # Fernet requires URL-safe base64 encoded key
        fernet_key = base64.urlsafe_b64encode(key_bytes)

        return Fernet(fernet_key)

    def encrypt(self, plaintext: str) -> str:
        """Encrypt a plaintext string.

        Args:
            plaintext: The string to encrypt

        Returns:
            The encrypted string (URL-safe base64 encoded)

        Raises:
            EncryptionError: If encryption fails
        """
        if not plaintext:
            raise EncryptionError("Cannot encrypt empty string")

        try:
            encrypted_bytes = self._fernet.encrypt(plaintext.encode("utf-8"))
            return encrypted_bytes.decode("utf-8")
        except Exception as e:
            raise EncryptionError(f"Failed to encrypt data: {e}")

    def decrypt(self, ciphertext: str) -> str:
        """Decrypt an encrypted string.

        Args:
            ciphertext: The encrypted string (URL-safe base64 encoded)

        Returns:
            The decrypted plaintext string

        Raises:
            EncryptionError: If decryption fails (invalid key or corrupted data)
        """
        if not ciphertext:
            raise EncryptionError("Cannot decrypt empty string")

        try:
            decrypted_bytes = self._fernet.decrypt(ciphertext.encode("utf-8"))
            return decrypted_bytes.decode("utf-8")
        except InvalidToken:
            raise EncryptionError(
                "Failed to decrypt data: invalid token (key may have changed)"
            )
        except Exception as e:
            raise EncryptionError(f"Failed to decrypt data: {e}")

    def get_key_hint(self, api_key: str) -> str:
        """Get a hint for the API key (last 4 characters).

        Args:
            api_key: The full API key

        Returns:
            The last 4 characters of the key prefixed with "..."
        """
        if len(api_key) < 4:
            return "..." + api_key
        return "..." + api_key[-4:]
