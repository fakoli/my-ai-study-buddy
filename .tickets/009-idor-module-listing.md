# 009 — IDOR on GET /courses/{id}/modules: no auth/ownership check

Status: **resolved 2026-08-24** · Severity: high (info disclosure) · Area: `backend/api/routes/modules.py`

## Finding
`GET /api/v1/courses/{course_id}/modules` had **no auth/ownership check**:
- No `user` dependency at all — anonymous callers could list any course's
  module metadata (id/title/order/flashcard_count/has_quiz).
- No visibility enforcement — private courses' module lists were exposed.
- The detail endpoint `GET /courses/{id}/modules/{module_id}` DID check
  visibility (authors only for private), so full content/quiz-answer keys
  were protected on private courses — but the **list** endpoint leaked
  existence + metadata.

Found independently by OX Alpha adversarial review of PR #18 (2026-08-24),
and confirmed by code reading:
- `services/module_service.py` `list_modules()` has no user/ownership param.
- `api/routes/modules.py` passed only `course_id` + service dep.

## Fix
`api/routes/modules.py` `list_modules` now takes `OptionalUser` and routes
through `CourseService.get_course_with_modules(course_id, user_id)`, which
enforces visibility (private = author only; public = anyone). This mirrors
the existing `get_course` pattern and returns the same
`list[ModuleSummary]` shape.

## Regression tests
`backend/tests/test_list_modules_auth.py` (4 tests):
- anonymous on private course -> not 200 (401/403/404)
- owner on private course -> 200
- any caller on public course -> 200
- other authenticated user on private course -> 403/404

## Verification
- `uv run pytest tests/test_list_modules_auth.py`: 4 passed
- `uv run pytest tests/`: 148 passed, no regressions
