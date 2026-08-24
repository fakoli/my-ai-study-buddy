# 006 — Frontend has zero test infrastructure (and docs claim otherwise)

Status: **resolved 2026-08-24** · Severity: high · Area: `frontend/`

## Problem
- No `test` script in `package.json`; no vitest/jest/RTL/playwright dependencies; no `test` block in
  `vite.config.ts`; **zero** `*.test.*` / `*.spec.*` files under `src/`.
- The frontend is ~105 source files (12 pages, 48 components, 26 hooks, 14 api clients, services,
  utils) with 0% automated coverage.
- The auth-token race that took a full day to diagnose in production (login 200 → session silently
  wiped) would have been a ~20-line unit test of `useAuth`. This is the class of bug this project
  keeps shipping.
- Note: `CLAUDE.md` documents a Vitest + RTL setup and an `npm run test` command that do not exist —
  see ticket 008 for the doc fix; this ticket is about building the real thing.

## Setup (React **19.2** — mind peer deps)
```bash
cd frontend
npm i -D vitest @testing-library/react @testing-library/jest-dom jsdom
# vite.config.ts: add `test` block (vitest/config):
#   test: { environment: 'jsdom', globals: true, setupFiles: './src/test/setup.ts' }
# package.json: "test": "vitest run", "test:watch": "vitest"
```
`@testing-library/react` v16 supports React 19. Add `src/test/setup.ts` importing
`@testing-library/jest-dom`.

## First specs (priority order — highest risk first)
1. **`src/hooks/useAuth.ts`** — the crown jewel:
   - login stores token, sets authenticated state
   - mount with existing valid token → `/auth/me` called, session restored
   - mount with stale/invalid token → token removed, unauthenticated
   - **the regression test**: a slow in-flight `checkAuth` resolves with failure AFTER a concurrent
     `login()` replaced the token → the new token must survive (this is exactly the bug that was fixed;
     encode it so it can never silently return)
   - logout clears token even when the API call fails
2. **`src/api/client.ts`** — error normalization, 401 handling, token injection into headers,
   base-URL resolution (`VITE_API_URL || '/api/v1'`).
3. **Mutation hooks** `useLearningPaths`, `useModuleSuggestions` — error paths (the "failed to create
   learning path" user-facing errors) and invalidation-on-success.
4. Pure utils in `src/utils/` as a quick win for coverage numbers.

Mock the API layer (`vi.mock('../api/auth')`) — no network, no backend needed.

## Acceptance criteria
- `npm run test` runs green from a clean checkout (no manual env setup).
- `useAuth` spec includes the concurrent-login regression case and passes.
- Wire into CI (`.github/workflows/`) alongside the backend job.
