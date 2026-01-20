from enum import Enum
from typing import Any


class ErrorCode(str, Enum):
    """Structured error codes for API responses."""

    # General errors
    VALIDATION_ERROR = "VALIDATION_ERROR"
    INTERNAL_ERROR = "INTERNAL_ERROR"

    # Authentication errors
    UNAUTHORIZED = "UNAUTHORIZED"
    INVALID_TOKEN = "INVALID_TOKEN"
    INVALID_CREDENTIALS = "INVALID_CREDENTIALS"

    # Authorization errors
    FORBIDDEN = "FORBIDDEN"
    ACCESS_DENIED = "ACCESS_DENIED"

    # Resource errors
    NOT_FOUND = "NOT_FOUND"
    DECK_NOT_FOUND = "DECK_NOT_FOUND"
    CARD_NOT_FOUND = "CARD_NOT_FOUND"
    QUIZ_NOT_FOUND = "QUIZ_NOT_FOUND"
    USER_NOT_FOUND = "USER_NOT_FOUND"
    SESSION_NOT_FOUND = "SESSION_NOT_FOUND"
    COURSE_NOT_FOUND = "COURSE_NOT_FOUND"
    MODULE_NOT_FOUND = "MODULE_NOT_FOUND"
    LEARNING_PATH_NOT_FOUND = "LEARNING_PATH_NOT_FOUND"

    # Course authoring errors
    COURSE_NOT_EDITABLE = "COURSE_NOT_EDITABLE"
    INVALID_MODULE_ORDER = "INVALID_MODULE_ORDER"
    IMAGE_DOWNLOAD_FAILED = "IMAGE_DOWNLOAD_FAILED"
    INVALID_IMAGE_FORMAT = "INVALID_IMAGE_FORMAT"

    # Conflict errors
    CONFLICT = "CONFLICT"
    EMAIL_ALREADY_EXISTS = "EMAIL_ALREADY_EXISTS"

    # Token errors
    INSUFFICIENT_TOKENS = "INSUFFICIENT_TOKENS"

    # Service errors
    AI_SERVICE_ERROR = "AI_SERVICE_ERROR"
    AI_SERVICE_UNAVAILABLE = "AI_SERVICE_UNAVAILABLE"


class StudyBuddyException(Exception):
    """Base exception for Study Buddy application."""

    def __init__(
        self,
        message: str,
        status_code: int = 400,
        code: ErrorCode | None = None,
        details: dict[str, Any] | None = None,
    ):
        self.message = message
        self.status_code = status_code
        self.code = code
        self.details = details or {}
        super().__init__(self.message)


class NotFoundException(StudyBuddyException):
    """Raised when a requested resource is not found."""

    def __init__(
        self,
        message: str = "Resource not found",
        code: ErrorCode = ErrorCode.NOT_FOUND,
        details: dict[str, Any] | None = None,
    ):
        super().__init__(message, 404, code, details)


class UnauthorizedException(StudyBuddyException):
    """Raised when authentication fails."""

    def __init__(
        self,
        message: str = "Unauthorized",
        code: ErrorCode = ErrorCode.UNAUTHORIZED,
        details: dict[str, Any] | None = None,
    ):
        super().__init__(message, 401, code, details)


class ForbiddenException(StudyBuddyException):
    """Raised when user lacks permission for an action."""

    def __init__(
        self,
        message: str = "Forbidden",
        code: ErrorCode = ErrorCode.FORBIDDEN,
        details: dict[str, Any] | None = None,
    ):
        super().__init__(message, 403, code, details)


class ConflictException(StudyBuddyException):
    """Raised when a resource conflict occurs (e.g., duplicate email)."""

    def __init__(
        self,
        message: str = "Resource conflict",
        code: ErrorCode = ErrorCode.CONFLICT,
        details: dict[str, Any] | None = None,
    ):
        super().__init__(message, 409, code, details)


class InsufficientTokensException(StudyBuddyException):
    """Raised when user doesn't have enough tokens for an operation."""

    def __init__(
        self,
        message: str = "Insufficient tokens",
        code: ErrorCode = ErrorCode.INSUFFICIENT_TOKENS,
        details: dict[str, Any] | None = None,
    ):
        super().__init__(message, 402, code, details)


class ValidationException(StudyBuddyException):
    """Raised when validation fails."""

    def __init__(
        self,
        message: str = "Validation error",
        code: ErrorCode = ErrorCode.VALIDATION_ERROR,
        details: dict[str, Any] | None = None,
    ):
        super().__init__(message, 422, code, details)


class AIServiceException(StudyBuddyException):
    """Raised when AI service operations fail."""

    def __init__(
        self,
        message: str = "AI service error",
        code: ErrorCode = ErrorCode.AI_SERVICE_ERROR,
        details: dict[str, Any] | None = None,
    ):
        super().__init__(message, 503, code, details)
