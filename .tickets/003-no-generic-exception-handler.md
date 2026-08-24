# 003 — No generic exception handler: unhandled errors leak as raw FastAPI 500s

Status: open · Severity: medium · Area: `backend/main.py`

## Problem
`main.py` registers exactly one exception handler: `StudyBuddyException` (main.py:83), which renders
the structured format `{"error": {"code", "message", "details"}}` (with legacy fallback via the
`X-Error-Format: legacy` header). There is **no handler for generic `Exception`** (verified: no
`@app.exception_handler(Exception)` anywhere in main.py).

Consequences:
1. Any bug that escapes a route as a plain Python exception produces FastAPI's default 500 body
   (`{"detail": "Internal Server Error"}`) — inconsistent with every other error the app emits, and
   it can leak implementation detail in debug mode.
2. Tests asserting structured error bodies cannot cover server errors (see ticket 001: the
   not-found-format test fails because a 404 for an unknown *route* is FastAPI's default, while a
   404 raised by app code IS structured — the API currently has two 404 dialects).
3. `services/admin_service.py:158-184` deliberately re-raises raw exceptions after rollback; today
   those hit the wire unstructured.

## Fix
Add to `main.py` next to the existing handler:

```python
from fastapi import Request
from fastapi.responses import JSONResponse

@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    logger.exception("Unhandled exception", path=request.url.path, method=request.method)
    return JSONResponse(
        status_code=500,
        content={"error": {
            "code": ErrorCode.INTERNAL_ERROR.value,
            "message": "An unexpected error occurred",
            "details": None,
        }},
    )
```

Notes:
- Keep the message generic (no `str(exc)` in the body) — don't leak internals; the full error goes
  to structured logs only.
- Check `exceptions.py` for the exact `ErrorCode` member name before pasting (the enum lives at
  exceptions.py:~30).
- `RequestValidationError` is handled by FastAPI's default (422) — that's fine and matches what
  ticket 001's ported validation tests expect; do NOT override it.

## Acceptance criteria
- Induce a 500 (e.g. the admin rollback test from ticket 002 once its mock works) → body is the
  structured `{"error": {...}}` shape, not `{"detail": ...}`.
- All currently-passing tests still pass (nothing today relies on the raw 500 body — verify by running
  the full suite).
