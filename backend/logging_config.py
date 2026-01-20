"""Structured logging configuration for Study Buddy backend."""

import logging
import sys
import uuid
from contextvars import ContextVar
from datetime import datetime, timezone
from typing import Any

# Context variable for request correlation
request_id_var: ContextVar[str | None] = ContextVar("request_id", default=None)


class StructuredFormatter(logging.Formatter):
    """JSON-like structured log formatter for production use."""

    def format(self, record: logging.LogRecord) -> str:
        log_data: dict[str, Any] = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
        }

        # Add request ID if available
        request_id = request_id_var.get()
        if request_id:
            log_data["request_id"] = request_id

        # Add source location for DEBUG level
        if record.levelno <= logging.DEBUG:
            log_data["source"] = {
                "file": record.filename,
                "line": record.lineno,
                "function": record.funcName,
            }

        # Add exception info if present
        if record.exc_info:
            log_data["exception"] = self.formatException(record.exc_info)

        # Add any extra fields
        if hasattr(record, "extra_data"):
            log_data["data"] = record.extra_data

        # Format as single-line JSON-ish output for structured logging
        parts = [f"{k}={v!r}" for k, v in log_data.items()]
        return " | ".join(parts)


class DevelopmentFormatter(logging.Formatter):
    """Human-readable formatter for development."""

    COLORS = {
        "DEBUG": "\033[36m",    # Cyan
        "INFO": "\033[32m",     # Green
        "WARNING": "\033[33m",  # Yellow
        "ERROR": "\033[31m",    # Red
        "CRITICAL": "\033[35m", # Magenta
    }
    RESET = "\033[0m"

    def format(self, record: logging.LogRecord) -> str:
        color = self.COLORS.get(record.levelname, self.RESET)
        request_id = request_id_var.get()

        # Build prefix
        prefix = f"{record.levelname:<8}"
        if request_id:
            prefix += f" [{request_id[:8]}]"

        # Build message
        msg = f"{color}{prefix}{self.RESET} {record.getMessage()}"

        # Add exception if present
        if record.exc_info:
            msg += f"\n{self.formatException(record.exc_info)}"

        return msg


def setup_logging(debug: bool = False) -> None:
    """Configure application logging.

    Args:
        debug: If True, use development formatter with colors and DEBUG level.
               If False, use structured formatter with INFO level.
    """
    root_logger = logging.getLogger()

    # Clear existing handlers
    root_logger.handlers.clear()

    # Create handler
    handler = logging.StreamHandler(sys.stdout)

    if debug:
        handler.setFormatter(DevelopmentFormatter())
        root_logger.setLevel(logging.DEBUG)
    else:
        handler.setFormatter(StructuredFormatter())
        root_logger.setLevel(logging.INFO)

    root_logger.addHandler(handler)

    # Reduce noise from third-party libraries
    logging.getLogger("httpx").setLevel(logging.WARNING)
    logging.getLogger("httpcore").setLevel(logging.WARNING)
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)


def generate_request_id() -> str:
    """Generate a unique request ID."""
    return str(uuid.uuid4())


def set_request_id(request_id: str | None = None) -> str:
    """Set the request ID for the current context."""
    if request_id is None:
        request_id = generate_request_id()
    request_id_var.set(request_id)
    return request_id


def get_request_id() -> str | None:
    """Get the current request ID."""
    return request_id_var.get()


class LoggerWithContext:
    """Logger wrapper that automatically includes context data."""

    def __init__(self, name: str):
        self._logger = logging.getLogger(name)

    def _log(self, level: int, msg: str, extra_data: dict[str, Any] | None = None) -> None:
        extra = {}
        if extra_data:
            extra["extra_data"] = extra_data
        self._logger.log(level, msg, extra=extra)

    def debug(self, msg: str, **extra: Any) -> None:
        self._log(logging.DEBUG, msg, extra or None)

    def info(self, msg: str, **extra: Any) -> None:
        self._log(logging.INFO, msg, extra or None)

    def warning(self, msg: str, **extra: Any) -> None:
        self._log(logging.WARNING, msg, extra or None)

    def error(self, msg: str, **extra: Any) -> None:
        self._log(logging.ERROR, msg, extra or None)

    def critical(self, msg: str, **extra: Any) -> None:
        self._log(logging.CRITICAL, msg, extra or None)

    def exception(self, msg: str, **extra: Any) -> None:
        self._logger.exception(msg, extra={"extra_data": extra} if extra else None)


def get_logger(name: str) -> LoggerWithContext:
    """Get a logger with context support."""
    return LoggerWithContext(name)
