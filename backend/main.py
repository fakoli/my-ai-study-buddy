import time

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from config import get_settings
from exceptions import ErrorCode, StudyBuddyException
from logging_config import get_logger, set_request_id, setup_logging

settings = get_settings()

# Configure logging
setup_logging(debug=settings.debug)
logger = get_logger(__name__)

app = FastAPI(
    title=settings.app_name,
    description="A learning platform for visual learners who learn by doing",
    version="0.1.0",
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def request_logging_middleware(request: Request, call_next):
    """Log all requests with timing and correlation ID."""
    # Set request ID (use existing or generate new)
    request_id = request.headers.get("X-Request-ID")
    request_id = set_request_id(request_id)

    start_time = time.perf_counter()

    # Log request
    client_ip = request.client.host if request.client and getattr(request.client, "host", None) else "unknown"
    logger.info(
        f"Request started: {request.method} {request.url.path}",
        method=request.method,
        path=request.url.path,
        client=client_ip,
    )

    try:
        response = await call_next(request)

        # Calculate duration
        duration_ms = (time.perf_counter() - start_time) * 1000

        # Log response
        logger.info(
            f"Request completed: {request.method} {request.url.path} -> {response.status_code}",
            method=request.method,
            path=request.url.path,
            status_code=response.status_code,
            duration_ms=round(duration_ms, 2),
        )

        # Add request ID to response headers for tracing
        response.headers["X-Request-ID"] = request_id

        return response

    except Exception as e:
        duration_ms = (time.perf_counter() - start_time) * 1000
        logger.error(
            f"Request failed: {request.method} {request.url.path}",
            method=request.method,
            path=request.url.path,
            duration_ms=round(duration_ms, 2),
            error=str(e),
        )
        raise


@app.exception_handler(StudyBuddyException)
async def study_buddy_exception_handler(request: Request, exc: StudyBuddyException):
    """Handle StudyBuddyException with structured error responses.

    Supports legacy format via X-Error-Format: legacy header for backward compatibility.
    """
    # Check for legacy format header
    error_format = request.headers.get("X-Error-Format", "").lower()

    if error_format == "legacy":
        # Backward compatible format
        return JSONResponse(
            status_code=exc.status_code,
            content={"detail": exc.message},
        )

    # New structured error format
    error_response = {
        "error": {
            "code": exc.code.value if exc.code else ErrorCode.INTERNAL_ERROR.value,
            "message": exc.message,
        }
    }

    if exc.details:
        error_response["error"]["details"] = exc.details

    return JSONResponse(
        status_code=exc.status_code,
        content=error_response,
    )


@app.get("/health")
async def health_check():
    return {"status": "healthy", "app": settings.app_name}


# Import and register routers
from api.routes import auth, decks, reviews, quiz, progress, references, ai, notifications

app.include_router(auth.router, prefix="/api/v1/auth", tags=["auth"])
app.include_router(decks.router, prefix="/api/v1/decks", tags=["decks"])
app.include_router(reviews.router, prefix="/api/v1/reviews", tags=["reviews"])
app.include_router(quiz.router, prefix="/api/v1/quiz", tags=["quiz"])
app.include_router(progress.router, prefix="/api/v1/progress", tags=["progress"])
app.include_router(references.router, prefix="/api/v1/references", tags=["references"])
app.include_router(ai.router, prefix="/api/v1/ai", tags=["ai"])
app.include_router(notifications.router, prefix="/api/v1/notifications", tags=["notifications"])
