# 004 — Backend lint findings (ruff): 80 total, all mechanical

Status: open · Severity: low · Area: `backend/`

Reproduce: `cd backend && uv run ruff check . --output-format concise`

## Auto-fixable (40) — run `uv run ruff check . --fix`
- **F541** f-string without placeholders (16): concentrated in `services/cache_service.py`
  (lines 142, 150, 155, 159, 187, 205, 270) and `services/request_deduplication.py` (121, 133, 143,
  151, 177). These are log strings like `f"Cache hit for key"` — fix is dropping the `f`.
- **I001** unsorted import blocks (13): `api/routes/{learning_paths,modules,references,uploads}.py`,
  `main.py:142`, `services/{cache_service,request_deduplication}.py`, others.
- **F401** unused imports (11), including real dead code worth a glance before deleting:
  - `storage/json_storage.py:2` — `import os` unused.
  - `api/routes/flashcard_ratings.py:8` — `FlashcardRating` imported but never referenced.

## Manual (40)
- **E501** line too long (28): worst offenders are `services/progress_service.py` (289, 380, 420,
  626, 686), `services/ai_generation_service.py` (237, 664, 762, 809), `services/ai_service.py`
  (98-100). Wrap or split; no behavior change.
- **E402** module import not at top of file (11):
  - `main.py:142-144` — router imports placed after app setup, deliberately (avoids circular
    imports with `dependencies`). Add `# noqa: E402` on each line rather than moving them.
  - `services/ai_generation_service.py:101-120` — a decorator is defined above the model/service
    imports; either move imports up (verify no circularity) or `# noqa: E402`.
- **F841** unused variable (1): `services/learning_path_service.py:134` in `update_path`:
  ```python
  path_data = await self._get_owned_path(path_id, user_id)   # result never used
  ```
  The call is load-bearing (it raises `NotFoundException`/`ForbiddenException` for non-owners), so
  the fix is dropping the assignment: `await self._get_owned_path(path_id, user_id)`.

## Acceptance criteria
- `uv run ruff check .` reports 0 errors.
- `uv run pytest tests/ -q` outcome unchanged from before the cleanup (37 passed at time of writing;
  failures tracked in tickets 001/002).
