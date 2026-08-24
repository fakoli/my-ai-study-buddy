# 008 — CLAUDE.md documents a frontend test setup that doesn't exist

Status: open · Severity: low · Area: `CLAUDE.md` (repo root)

## Problem
`CLAUDE.md` states the frontend uses **Vitest + React Testing Library** and documents an
`npm run test` command. None of it exists in the live repo (no deps, no script, no config, no test
files — see ticket 006). An agent or contributor trusting the doc will try `npm run test` and hit a
wall, or worse, "fix" the doc by deleting accurate sections elsewhere.

The same drift pattern likely affects other claims — worth a full pass while we're in there:
- React version: docs/context may say 18; `package.json` has **19.2**.
- Backend port: README/CLAUDE.md were updated to 8010 during the tailnet deployment (verify both are
  consistent with `scripts/start-tailnet.sh`).
- Any mention of OpenAI/Anthropic/Claude provider config should already be gone post-anvil-refactor —
  grep to confirm: `grep -in "openai\|anthropic\|claude" CLAUDE.md README.md`. (At time of writing the
  only hits are "OpenAI-compatible" describing the Anvil router's wire protocol, which is correct and
  should stay — no provider SDKs or keys remain.)

## Fix
Either (a) make the docs true by completing ticket 006, or (b) in the meantime, correct CLAUDE.md to
state the frontend currently has **no test runner** and point at ticket 006 for the plan. Don't leave
phantom commands documented.

## Acceptance criteria
- Every command quoted in CLAUDE.md/README.md actually runs on a clean checkout.
- `grep -rin "openai\|anthropic" CLAUDE.md README.md` returns nothing (or only historical notes).
