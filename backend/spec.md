# Study Buddy Backend Specification

## Overview

This document defines the architectural decisions, constraints, and patterns for the Study Buddy backend. It serves as the authoritative reference for developers and AI assistants working on this codebase.

---

## Architecture Decisions (ADRs)

### ADR-001: Layered Architecture

**Status:** Accepted

**Context:** We need a maintainable, testable architecture for the backend.

**Decision:** Adopt a three-layer architecture:
1. **Routes Layer** (`api/routes/`) - HTTP handling, request/response validation
2. **Services Layer** (`services/`) - Business logic, orchestration
3. **Storage Layer** (`storage/`) - Data persistence abstraction

**Consequences:**
- Route handlers stay thin (validate → call service → return response)
- Business logic is centralized and testable
- Storage backend can be swapped without affecting business logic

### ADR-002: Async-First Design

**Status:** Accepted

**Context:** The application needs to handle concurrent requests efficiently.

**Decision:** Use async/await throughout the codebase.

**Consequences:**
- All service methods are `async def`
- Storage backend methods are `async def`
- Use `aiofiles` for file operations
- Use `aiosqlite` for SQLite operations

### ADR-003: No ORM

**Status:** Accepted

**Context:** We want simple, predictable data access.

**Decision:** Use raw storage abstraction instead of an ORM.

**Consequences:**
- Storage backend provides simple CRUD operations
- No magic query generation
- Explicit data conversion in services
- Easier to swap storage backends

### ADR-004: Pydantic v2 for Data Models

**Status:** Accepted

**Context:** Need type-safe request/response handling.

**Decision:** Use Pydantic v2 models for all API boundaries.

**Consequences:**
- Automatic request validation
- Type-safe response serialization
- `model_dump()` for dict conversion
- `model_validate()` for construction from dicts

### ADR-005: Structured Error Codes

**Status:** Accepted

**Context:** Need consistent, machine-readable error responses.

**Decision:** Use `ErrorCode` enum with structured error format.

**Consequences:**
- All errors include `code`, `message`, and optional `details`
- Backward compatibility via `X-Error-Format: legacy` header
- Specific codes like `DECK_NOT_FOUND` instead of generic `NOT_FOUND`

---

## Constraints

### Python Version

- **Minimum:** Python 3.11+
- **Reason:** Required for modern type annotations, performance improvements

### Dependencies

- **FastAPI:** Web framework
- **Pydantic v2:** Data validation
- **Pydantic-Settings:** Configuration management
- **python-jose:** JWT handling
- **bcrypt:** Password hashing
- **aiofiles:** Async file operations
- **anthropic:** AI service integration (optional)

### Storage Backends

| Backend | Use Case | Status |
|---------|----------|--------|
| JSON | Local development | Implemented |
| SQLite | Single-instance production | Implemented |
| Supabase | Multi-user cloud | Planned |

---

## Error Handling Patterns

### Exception Hierarchy

```
StudyBuddyException (base)
├── NotFoundException (404)
├── UnauthorizedException (401)
├── ForbiddenException (403)
├── ConflictException (409)
├── ValidationException (422)
├── InsufficientTokensException (402)
└── AIServiceException (503)
```

### Error Response Format

**Standard Format:**
```json
{
  "error": {
    "code": "DECK_NOT_FOUND",
    "message": "Deck not found",
    "details": {
      "deck_id": "abc-123"
    }
  }
}
```

**Legacy Format:** (with `X-Error-Format: legacy` header)
```json
{
  "detail": "Deck not found"
}
```

### Exception Usage Guidelines

1. **Catch specific exceptions only:**
   ```python
   # Good
   except (UnauthorizedException, JWTError):
       return None

   # Bad - catches everything
   except Exception:
       return None
   ```

2. **Use structured error codes:**
   ```python
   raise NotFoundException(
       "Deck not found",
       code=ErrorCode.DECK_NOT_FOUND,
       details={"deck_id": deck_id}
   )
   ```

3. **Let unexpected errors propagate:**
   - Don't catch database errors in service layer
   - Let FastAPI's error handlers deal with unexpected errors

---

## Security Requirements

### Authentication

- **Method:** JWT Bearer tokens
- **Algorithm:** HS256
- **Expiration:** Configurable (default 24 hours)
- **Secret:** Must be set in production (validated at startup)

### Production Secret Validation

The application **WILL NOT START** in production mode (`DEBUG=false`) with the default JWT secret. This is enforced by Pydantic model validation.

### Authorization

- All user resources must verify ownership before access
- Use `BaseService.get_owned_resource()` for consistent checks
- Never expose resource existence to unauthorized users

### Input Validation

- All API inputs validated via Pydantic models
- Path parameters validated at route level
- Business rule validation in service layer

---

## Testing Strategy

### Test Levels

| Level | Target | Coverage Goal |
|-------|--------|---------------|
| Unit | Services | 80% |
| Integration | Routes + Storage | 60% |
| E2E | Full API | Key paths only |

### Test Organization

```
backend/tests/
├── conftest.py          # Shared fixtures
├── test_auth.py         # Auth endpoints
├── test_decks.py        # Deck CRUD
├── test_cards.py        # Card operations
├── test_reviews.py      # Spaced repetition
├── test_quiz.py         # Quiz generation/submission
├── test_progress.py     # Progress tracking
└── test_error_cases.py  # Error handling scenarios
```

### Key Fixtures

```python
@pytest.fixture
async def client():
    """Async test client for API calls."""

@pytest.fixture
async def auth_headers(client):
    """Headers with valid JWT token."""

@pytest.fixture
async def deck_with_cards(client, auth_headers):
    """Pre-populated deck for testing."""

@pytest.fixture
async def other_user_deck(client):
    """Deck owned by different user for access tests."""
```

---

## Common Patterns

### Service Method Structure

```python
async def get_resource(self, resource_id: str, user_id: str) -> Model:
    # 1. Verify ownership
    data = await self.get_owned_resource(
        "collection", resource_id, user_id,
        "Resource", ErrorCode.RESOURCE_NOT_FOUND
    )

    # 2. Transform data
    return Model(
        id=data["id"],
        created_at=ensure_datetime(data["created_at"]),
        ...
    )
```

### DateTime Handling

Always use `ensure_datetime()` for storage data:

```python
from utils.datetime_utils import ensure_datetime

# Converts string to datetime, passes through datetime objects
created_at = ensure_datetime(data["created_at"])
```

### Route Handler Structure

```python
@router.post("/resource")
async def create_resource(
    data: CreateRequest,
    user: User = Depends(get_current_user),
    storage: StorageBackend = Depends(get_storage),
) -> ResourceResponse:
    service = ResourceService(storage)
    return await service.create(user.id, data)
```

---

## Configuration

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DEBUG` | No | `false` | Enable debug mode |
| `STORAGE_BACKEND` | No | `json` | Storage type |
| `STORAGE_PATH` | No | `./data` | Storage path |
| `JWT_SECRET` | Prod | - | JWT signing secret |
| `JWT_EXPIRATION_HOURS` | No | `24` | Token expiry |
| `ANTHROPIC_API_KEY` | No | - | AI service key |

### Production Checklist

- [ ] Set `DEBUG=false`
- [ ] Set secure `JWT_SECRET` (32+ random bytes)
- [ ] Configure `CORS_ORIGINS` appropriately
- [ ] Set up proper logging
- [ ] Configure storage backend (SQLite or Supabase)

---

## Changelog

### v0.2.0 (Current)

- Added structured error codes (`ErrorCode` enum)
- Added `BaseService` for authorization patterns
- Added `ensure_datetime()` utility
- Added production secret validation
- Fixed bare exception handling in `dependencies.py`
- Fixed AI service error handling (now raises exceptions)

### v0.1.0

- Initial implementation
- JSON storage backend
- Basic CRUD for decks, cards, reviews, quizzes
