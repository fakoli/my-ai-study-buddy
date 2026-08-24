# 005 — Frontend eslint: 10 errors, 4 warnings

Status: open · Severity: medium · Area: `frontend/`

Reproduce: `cd frontend && npx eslint src` (project is **React 19.2** + TypeScript).

## Errors (10)

### 005a — `src/hooks/useAuth.ts:14` dead code (fix first, it's mine)
`subscribeToStorageChanges` was defined but never called. The cross-tab token sync was intended when
this hook was rewritten to fix the stale-closure token race, but the subscription was never wired in.
**RESOLVED 2026-08-23 (wire-up chosen):** added
`useEffect(() => subscribeToStorageChanges(checkAuth), [checkAuth])` — storage events from other tabs
re-run the fresh-read `checkAuth`, so login/logout in one tab converges all tabs. `tsc --noEmit` clean,
eslint on useAuth.ts clean, rebuilt and redeployed (live bundle `index-CBPGHeoR.js`).

### 005b — `src/pages/ModuleEditor.tsx:71` setState synchronously in effect
`react-hooks/set-state-in-effect`: an effect calls setState on every render of certain props, which
can trigger cascading renders (the same bug family as the auth race). Read lines ~60-80: it mirrors
loaded `flashcards`/`quiz`/`form` data into local state. Proper fix is deriving that state from the
query result directly (or keying the component by module id) instead of copying in an effect.
This is the only error here with real runtime risk; the rest are style.

### 005c — `react-refresh/only-export-components` (4)
Contexts/hooks exported from component files:
- `src/components/common/AuthProvider.tsx:26`
- `src/components/common/LiveRegion.tsx:9`
- `src/components/common/ToastProvider.tsx:19` and `:85`
Fix: move each context (+ its hook) into its own file (e.g. `common/auth-context.ts`) and re-export,
or downgrade the rule to warning in eslint config if fast-refresh ergonomics aren't a priority.

### 005d — `src/components/common/Card.tsx:31,45,55` empty interfaces
Three `interface X extends Y {}` declarations — replace with `type X = Y`.

### 005e — `src/pages/CourseDetail.tsx:275` unused `index` param
Drop the parameter or prefix `_index`.

## Warnings (4)
- `src/pages/CourseEditor.tsx:47` missing hook deps `form`, `outlines`.
- `src/pages/ModuleEditor.tsx:73` missing deps `flashcards`, `form`, `quiz` — same root cause as 005b;
  fixing the effect design fixes both.
- `src/pages/ModuleViewer.tsx:80` missing dep `updateProgress` (stable? verify it's wrapped in
  useCallback before adding).
- `src/services/codeExecution.ts:38` unused `eslint-disable no-var` directive — delete the comment.

## Acceptance criteria
- `npx eslint src` exits 0 with zero errors (warnings acceptable if individually justified in a
  code comment).
- `npx tsc --noEmit` still clean; `npm run build` succeeds.
