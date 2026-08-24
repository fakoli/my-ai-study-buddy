# 001 — Stale deck-domain tests break the backend suite

Status: **resolved 2026-08-24** · Severity: high · Area: `backend/tests/`

> **Resolution:** Ported to the current courses → modules domain.
> - `tests/conftest.py`: replaced `deck_with_cards` / `other_user_deck` / `generated_quiz`
>   with `course_with_modules` (course + 3 modules incl. flashcards + quiz) and
>   `other_user_course`; added `_create_course` helper.
> - `tests/test_error_cases.py`: unchanged classes, endpoints re-pointed to `/courses`,
>   `/courses/{id}/modules`, and `/courses/{id}/modules/{id}/flashcards/rate`. Notably:
>   - `404` code is `COURSE_NOT_FOUND`, not `NOT_FOUND`.
>   - `GET /courses/{id}/modules` has no ownership check (any caller may list),
>     so the forbidden tests use the author-scoped `PUT /courses/{id}`.
>   - The invalid-difficulty test uses the flashcard-rating endpoint.
> - `tests/test_progress.py`: `total_cards_reviewed` is intentionally 0 in the
>   current domain (progress_service.py:611); assert `total_quizzes_completed`
>   instead. Added `test_get_dashboard_stats` + `test_course_progress` for real coverage.
> - All 18 previously-failing/erroring tests pass; suite is 55/55 green.

## Symptom
`uv run pytest tests/ -q` (run from `backend/`) reports **37 passed, 7 failed, 11 errors**.
All 18 non-passing outcomes trace back to one cause: the app no longer has a "decks" domain.

The codebase migrated from standalone decks/cards/quizzes to the courses → modules →
flashcards model. The endpoints these tests hit return **404** because they were removed:

- `POST /api/v1/decks` — no such route
- `GET/PUT/DELETE /api/v1/decks/{id}` — no such routes
- `POST /api/v1/decks/{id}/cards` — no such route
- `POST /api/v1/reviews` — no such route (flashcard review now goes through
  `POST /api/v1/progress/modules/{course_id}/{module_id}` with `action: "review_flashcard"`,
  see `backend/api/routes/progress.py:48`)
- `POST /api/v1/quiz/generate` and `/api/v1/quiz/submit` — no such routes (quiz generation is now
  `POST /api/v1/quiz` under the generation router, `backend/api/routes/generation.py:96`; there is
  **no quiz-submission endpoint at all** in the current API)

## Affected tests (exact list)

`tests/test_error_cases.py`:
- `TestStructuredErrorFormat::test_not_found_error_format` — hits `/api/v1/decks/nonexistent-deck-id`,
  gets FastAPI's default `{"detail": "Not Found"}` instead of the structured error body, so the
  `"error" in data` assert fails. (The structured handler only fires for `StudyBuddyException`s.)
- `TestStructuredErrorFormat::test_unauthorized_error_format` — expects 401 from `GET /api/v1/decks`, gets 404.
- `TestAuthenticationErrors::test_invalid_token` — same 404-instead-of-401 pattern.
- `TestAuthenticationErrors::test_expired_token_format` — same.
- `TestAuthenticationErrors::test_missing_bearer_prefix` — same.
- `TestValidationErrors::test_create_deck_missing_title` — expects 422, gets 404.

Setup errors (fixture `deck_with_cards` in `tests/conftest.py:95` asserts `POST /api/v1/decks → 200`,
gets 404, so every test requesting it errors in setup):
- `TestStructuredErrorFormat::test_forbidden_error_format`
- `TestAccessControl::test_cannot_access_other_user_deck` (uses `other_user_deck` fixture, conftest.py:138)
- `TestAccessControl::test_cannot_update_other_user_deck`
- `TestAccessControl::test_cannot_delete_other_user_deck`
- `TestAccessControl::test_cannot_add_card_to_other_user_deck`
- `TestValidationErrors::test_create_card_missing_front`
- `TestValidationErrors::test_review_invalid_difficulty`
- `tests/test_progress.py::test_get_stats_after_activity` (also uses `generated_quiz` fixture, conftest.py:124)
- `tests/test_progress.py::test_get_topic_mastery`
- `tests/test_progress.py::test_topic_mastery_increases_with_reviews`
- `tests/test_progress.py::test_accuracy_rate_calculation`

## What the tests were actually verifying (port, don't just delete)
1. **Structured error format** (`{"error": {"code", "message", "details"}}`) for 401/403/404 raised by
   app code — re-point at any existing endpoint that raises these, e.g. `GET /api/v1/courses/{id}`
   with a bogus id (404 via `NotFoundException`), `GET /api/v1/paths` without auth (401), and a
   cross-user access attempt on `/api/v1/paths/{id}` or `/api/v1/courses/{id}/modules`.
2. **Auth rejection** for invalid/expired/malformed tokens — same re-pointing; the 401 comes from
   `dependencies.py` token validation, which is domain-agnostic.
3. **Pydantic validation → 422** — use any real endpoint with required fields, e.g.
   `POST /api/v1/paths` without a title (see `models/learning_path.py`).
4. **Progress math** (stats after activity, topic mastery, accuracy rate) — needs new fixtures built on
   the current domain: create a course (`POST /api/v1/courses`), add a module
   (`POST /api/v1/courses/{id}/modules`), then drive progress via
   `POST /api/v1/progress/modules/{course_id}/{module_id}`. Note there is no quiz-submit endpoint;
   quiz scoring, if it exists, lives in `services/module_service.py` — check before porting the
   accuracy-rate test, and drop it if quiz submission was intentionally removed.

## Acceptance criteria
- `uv run pytest tests/ -q` exits 0 (all green) or every remaining failure is a ticketed known issue.
- The structured-error-format behavior still has at least one passing test per error class (401/403/404).
- No test references `/api/v1/decks`, `/api/v1/reviews`, or `/api/v1/quiz/*`.

## Reproduce
```bash
cd backend && uv run pytest tests/test_error_cases.py tests/test_progress.py -q
```
