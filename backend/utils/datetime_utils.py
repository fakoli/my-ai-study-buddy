"""Datetime conversion utilities for consistent data handling."""

from datetime import datetime
from typing import Any


def ensure_datetime(value: Any) -> datetime | None:
    """Convert string to datetime if needed, pass through datetime objects.

    This utility handles the common pattern of datetime values that may be
    stored as ISO format strings (from JSON storage) or as datetime objects
    (from SQLite/Supabase storage).

    Args:
        value: A datetime object, ISO format string, or None.

    Returns:
        A datetime object or None if the input was None or empty.

    Examples:
        >>> ensure_datetime("2024-01-15T10:30:00+00:00")
        datetime(2024, 1, 15, 10, 30, tzinfo=timezone.utc)

        >>> ensure_datetime(datetime.now())  # Returns as-is
        datetime(...)

        >>> ensure_datetime(None)
        None
    """
    if value is None:
        return None
    if isinstance(value, datetime):
        return value
    if isinstance(value, str) and value:
        return datetime.fromisoformat(value)
    return None


def ensure_datetime_required(value: Any, field_name: str = "value") -> datetime:
    """Convert to datetime, raising ValueError if None.

    Args:
        value: A datetime object or ISO format string.
        field_name: Name of the field for error messages.

    Returns:
        A datetime object.

    Raises:
        ValueError: If the value is None or cannot be converted.
    """
    result = ensure_datetime(value)
    if result is None:
        raise ValueError(f"{field_name} cannot be None")
    return result
