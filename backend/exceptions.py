class StudyBuddyException(Exception):
    """Base exception for Study Buddy application."""

    def __init__(self, message: str, status_code: int = 400):
        self.message = message
        self.status_code = status_code
        super().__init__(self.message)


class NotFoundException(StudyBuddyException):
    """Raised when a requested resource is not found."""

    def __init__(self, message: str = "Resource not found"):
        super().__init__(message, 404)


class UnauthorizedException(StudyBuddyException):
    """Raised when authentication fails."""

    def __init__(self, message: str = "Unauthorized"):
        super().__init__(message, 401)


class ForbiddenException(StudyBuddyException):
    """Raised when user lacks permission for an action."""

    def __init__(self, message: str = "Forbidden"):
        super().__init__(message, 403)


class ConflictException(StudyBuddyException):
    """Raised when a resource conflict occurs (e.g., duplicate email)."""

    def __init__(self, message: str = "Resource conflict"):
        super().__init__(message, 409)


class InsufficientTokensException(StudyBuddyException):
    """Raised when user doesn't have enough tokens for an operation."""

    def __init__(self, message: str = "Insufficient tokens"):
        super().__init__(message, 402)


class ValidationException(StudyBuddyException):
    """Raised when validation fails."""

    def __init__(self, message: str = "Validation error"):
        super().__init__(message, 422)
