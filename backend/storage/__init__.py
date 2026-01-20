from config import Settings
from storage.base import StorageBackend
from storage.json_storage import JSONStorage

_storage_instance: StorageBackend | None = None


def get_storage_backend(settings: Settings) -> StorageBackend:
    """Factory function to get the configured storage backend."""
    global _storage_instance

    if _storage_instance is not None:
        return _storage_instance

    if settings.storage_backend == "json":
        _storage_instance = JSONStorage(settings.storage_path)
    elif settings.storage_backend == "sqlite":
        from storage.sqlite_storage import SQLiteStorage

        _storage_instance = SQLiteStorage(settings.storage_path)
    elif settings.storage_backend == "supabase":
        from storage.supabase_storage import SupabaseStorage

        if not settings.supabase_url or not settings.supabase_key:
            raise ValueError("Supabase URL and key are required for supabase backend")
        _storage_instance = SupabaseStorage(settings.supabase_url, settings.supabase_key)
    else:
        raise ValueError(f"Unknown storage backend: {settings.storage_backend}")

    return _storage_instance
