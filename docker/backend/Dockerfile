# Study Buddy Backend - Multi-stage Docker Build
# Uses Python 3.11-alpine with UV package manager

# =============================================================================
# Builder Stage - Install dependencies
# =============================================================================
FROM python:3.11-alpine AS builder

# Install build dependencies for compiled Python packages
RUN apk add --no-cache \
    gcc \
    musl-dev \
    libffi-dev \
    openssl-dev

# Install UV package manager
COPY --from=ghcr.io/astral-sh/uv:latest /uv /bin/uv

WORKDIR /app

# Copy dependency files first for layer caching
COPY backend/pyproject.toml backend/uv.lock ./

# Install dependencies into .venv
RUN uv sync --frozen --no-dev --no-install-project

# =============================================================================
# Runtime Stage - Minimal production image
# =============================================================================
FROM python:3.11-alpine AS runtime

# Install runtime dependencies only
RUN apk add --no-cache \
    libffi \
    openssl \
    wget

# Create non-root user for security
RUN addgroup -g 1000 appgroup && \
    adduser -u 1000 -G appgroup -h /app -D appuser

WORKDIR /app

# Copy virtual environment from builder
COPY --from=builder /app/.venv /app/.venv

# Copy application code
COPY backend/ ./

# Create data directory for storage
RUN mkdir -p /app/data /app/uploads && \
    chown -R appuser:appgroup /app

# Switch to non-root user
USER appuser

# Add venv to PATH
ENV PATH="/app/.venv/bin:$PATH"
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1

# Cloud Run uses PORT environment variable
ENV PORT=8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:${PORT}/health || exit 1

# Expose port
EXPOSE ${PORT}

# Run the application
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT}"]
