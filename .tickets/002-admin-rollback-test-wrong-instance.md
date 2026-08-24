# 002 — Admin rollback test patches a storage instance the app never uses

Status: **resolved 2026-08-24** · Severity: medium · Area: `backend/tests/test_admin.py`, `backend/tests/conftest.py`

> **Resolution:** The test now patches the **singleton** the app actually uses
> (`from storage import get_storage_backend; backend = get_storage_backend(get_settings())`)
> instead of the fixture's fresh `JSONStorage`, and asserts `create_call_count >= 1`
> so the failure path is provably exercised. Combined with ticket 003's route-level
> translation, the test passes: 500, balance restored, no transaction row.

## Symptom
`tests/test_admin.py::test_adjust_tokens_rollback_on_transaction_failure` fails:
expects HTTP 500, gets **200 OK**. The simulated failure never reaches the app under test.

## Root cause (verified empirically)
Two different `JSONStorage` instances exist in every test:

1. The `storage` fixture (`tests/conftest.py:17-19`) returns a **fresh** `JSONStorage(temp_storage_path)`.
2. The FastAPI app's dependency `get_storage()` (`dependencies.py:13`) calls
   `get_storage_backend(settings)` from `storage/__init__.py`, which returns a **process-wide singleton**.

The autouse `use_test_storage` fixture (conftest.py:22-39) resets the singleton and points its
`STORAGE_PATH` env var at the same temp dir, so both instances read/write the **same files** —
data-level assertions work. But the test does:

```python
monkeypatch.setattr(storage, "create", mock_create)   # patches instance #1
```

while the request path uses instance #2 (the singleton), whose `create` is unpatched. Verified:
patching the singleton makes `AdminService.adjust_tokens` raise and roll back correctly; patching a
separate `JSONStorage` object changes nothing server-side.

## Fix options (pick one)
1. **Patch the singleton in the test**: obtain it via
   `from storage import get_storage_backend; from config import get_settings;
   s = get_storage_backend(get_settings())` and monkeypatch that instance. Keep the `storage`
   fixture for data assertions (same temp dir, so both see identical state).
2. **Make the fixture return the singleton** (`get_storage_backend(get_settings())` instead of a
   fresh `JSONStorage`) — cleaner long-term; affects every test using `storage`, verify they all
   still pass (they should: same files either way).

## Also fix in the same ticket (test hygiene, same root cause family)
- The rollback path in `services/admin_service.py:163-184` does a function-local
  `import logging; logger = logging.getLogger(__name__)` — move to module level.
- After the mock works, the test expects **500**. That expectation depends on ticket 003
  (generic exception handler). Until 003 is done, an unhandled `Exception` from a route becomes a
  FastAPI 500 with a plain body — the assert still passes, but if 003 wraps errors into structured
  responses, decide here whether rollback-failure should surface as 500 (yes) and keep the test.

## Acceptance criteria
- The test fails when the mock is NOT installed (sanity: temporarily comment it out → must fail).
- With the mock installed: response is 500, user's `token_balance` restored to pre-adjustment value,
  zero rows in `token_transactions`.

## Reproduce
```bash
cd backend && uv run pytest tests/test_admin.py::test_adjust_tokens_rollback_on_transaction_failure -q
# assert 200 == 500
```
