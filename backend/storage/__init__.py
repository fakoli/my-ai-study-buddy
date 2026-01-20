from pathlib import Path

from config import Settings
from storage.base import StorageBackend
from storage.json_storage import JSONStorage

_storage_instance: StorageBackend | None = None


def get_storage_backend(settings: Settings) -> StorageBackend:
    """Factory function to get the configured storage backend.

    Creates a singleton instance of the appropriate storage backend based on
    the STORAGE_BACKEND environment variable.

    Supported backends:
        - json: JSON file-based storage (default, for development)
        - sqlite: SQLite database (for single-instance production)
        - supabase: Supabase cloud database (for multi-user production)
    """
    global _storage_instance

    if _storage_instance is not None:
        return _storage_instance

    if settings.storage_backend == "json":
        _storage_instance = JSONStorage(settings.storage_path)
    elif settings.storage_backend == "sqlite":
        from storage.sqlite_storage import SQLiteStorage

        # Ensure path has .db extension for SQLite
        db_path = settings.storage_path
        if not db_path.endswith(".db"):
            db_path = str(Path(db_path) / "study_buddy.db")
        _storage_instance = SQLiteStorage(db_path)
    elif settings.storage_backend == "supabase":
        from storage.supabase_storage import SupabaseStorage

        if not settings.supabase_url or not settings.supabase_key:
            raise ValueError("Supabase URL and key are required for supabase backend")
        _storage_instance = SupabaseStorage(settings.supabase_url, settings.supabase_key)
    else:
        raise ValueError(f"Unknown storage backend: {settings.storage_backend}")

    return _storage_instance


def reset_storage() -> None:
    """Reset the storage instance (useful for testing)."""
    global _storage_instance
    _storage_instance = None
