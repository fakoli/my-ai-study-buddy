# Tickets

Unsolved issues from the 2026-08-23 full codebase sweep (type checks, lint, tests, coverage).
Each ticket is self-contained enough for another agent to pick up and fix without this conversation.

## Status legend
- `open` — unsolved, needs work
- `fixed` — resolved during the sweep (kept here as a record)

## Index

| Ticket | Area | Severity | Status |
|--------|------|----------|--------|
| [001](001-stale-deck-domain-tests.md) | backend/tests | high | **resolved 2026-08-24** |
| [002](002-admin-rollback-test-wrong-instance.md) | backend/tests + main.py | medium | **resolved 2026-08-24** |
| [003](003-no-generic-exception-handler.md) | backend/main.py | medium | **resolved 2026-08-24** (targeted) |
| [004](004-backend-lint-findings.md) | backend | low | open |
| [005](005-frontend-eslint-findings.md) | frontend | medium | open (005a resolved 2026-08-23; 005b-e remain) |
| [006](006-no-frontend-test-infrastructure.md) | frontend | high | open |
| [007](007-service-layer-coverage-gaps.md) | backend/tests | high | **resolved 2026-08-24 (PR #19)** |
| [008](008-claude-md-drift.md) | docs (CLAUDE.md) | low | open |
| [009](009-idor-module-listing.md) | backend/api/routes/modules.py | high | **resolved 2026-08-24** |

## Fixed during the sweep (record only)

- **F1** `tests/test_admin.py` imported `get_storage` from `storage` (it lives in `dependencies.py`) —
  crashed the entire pytest collection. One-line import fix applied; suite now runs.
- **F2** Frontend hardcoded `http://localhost:8000/api/v1` API base broke login for all tailnet users.
  Replaced with same-origin `/api/v1` in `frontend/src/api/client.ts` + `uploads.ts`; rebuilt and redeployed.
- **F3** Stale-closure token race in `useAuth.ts` wiped valid sessions after reload (login 200, then all
  requests unauthenticated). Hook rewritten to read the token fresh from localStorage on every check and
  only clear it if unchanged since verification.
