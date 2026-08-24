# 007 — Backend service-layer coverage gaps (53% overall; core domain <25%)

Status: open · Severity: high · Area: `backend/tests/`

Coverage baseline from `uv run pytest tests/ --cov=. --cov-report=term-missing -q`:
**52.7% (2,338/4,435 stmts)**. Models are all at 100%; the gap is entirely in services and some
route handlers.

## Zero-coverage modules (start here — nothing guards them)
| Module | Stmts | What it does |
|---|---|---|
| `services/parallel_generation_service.py` | 50 | Concurrent multi-module generation fan-out |
| `services/encryption_service.py` | 38 | Encryption helpers (verify what actually calls it — may be dead code; if so, delete instead of testing) |
| `models/quiz.py` | 41 | Quiz pydantic models — **nothing imports them** (verified: no non-test reference). Candidate for deletion, not testing. |

## Dangerously thin (<25%) — the core product logic
| Module | Cov | Stmts | Risk notes |
|---|---|---|---|
| `services/module_service.py` | 13% | 164 | The "create learning path/module" code path users actually hit; quiz scoring may live here |
| `services/flashcard_rating_service.py` | 13% | 108 | Spaced-repetition scheduling — correctness-critical, zero tests |
| `services/course_service.py` | 15% | 238 | Largest service in the codebase, almost untested |
| `services/anvil_client.py` | 18% | 107 | The Anvil router integration (HTTP client, retries, media handling) — only happy path touched |
| `services/image_service.py` | 17% | 100 | Upload pipeline |
| `services/ai_generation_service.py` | 19% | 261 | Module suggestion, content/quiz/flashcard generation, **token-cost charging** (TOKEN_COSTS at line ~122) |
| `services/learning_path_service.py` | 20% | 98 | Path CRUD + visibility; note the F841 in `update_path` (ticket 004) |
| `services/progress_service.py` | 21% | 309 | Streak/mastery/accuracy math — classic bug magnet, second-largest service |

## Also thin but lower priority (24-50%)
`cache_service` 24%, `email_service` 25%, `sms_service` 18%, `notification_service` 23%,
`reference_service` 31%, `request_deduplication` 35%, `course_orchestrator` 39%,
`base_service` 45%, `sqlite_storage` 49% (json_storage at 81% is the reference for style).

Route handlers worth adding a few integration tests to: `uploads.py` 51%, `learning_paths.py` 58%,
`references.py` 59%, `modules.py` 63%.

## How to test these (pattern that works in this repo)
- Use the existing `client` fixture (httpx ASGITransport, conftest.py:42) for route-level tests.
- **Mock the Anvil client** (`services/anvil_client.get_anvil_client`) with `AsyncMock` — never hit
  the real router in unit tests; see `tests/test_ai_service.py` as the working example (100% coverage
  of ai_service via mocks).
- **Storage**: use the `storage` fixture, but remember ticket 002's singleton gotcha for anything that
  patches storage methods.
- Token-cost assertions: after each generation call, read `token_transactions` from storage and assert
  the charged amount matches `TOKEN_COSTS`.

## Suggested order of attack
1. `learning_path_service` + `module_service` (user-facing pain points)
2. `flashcard_rating_service` (spaced-repetition correctness)
3. `anvil_client` (retry/error paths against a mocked transport)
4. `progress_service` math (property-style tests: streak resets, mastery bounds, accuracy invariants)
5. Delete-or-test the zero-coverage modules above

## Acceptance criteria
- Overall coverage ≥ 70%; no service module below 60% except `parallel_generation_service` (needs a
  design decision on whether it's used at all — check callers before investing).
- Every token-charging path has an assertion on the resulting transaction.
