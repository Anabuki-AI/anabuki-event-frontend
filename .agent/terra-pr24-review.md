# Terra review: PR #24

Reviewed `fix/remove-admin-login-qa` against `origin/main` after fetching the frontend remote.

## Result

No correctness blocker was found in the Q&A removal or the OAuth, application, approval, session-exchange, and logout flows. The removal is confined to the two editorial Q&A cards and their styling; it does not alter the authentication lifecycle.

## Maintainability finding — addressed

**Severity: medium (maintainability).** `AdminPortal.vue` mixed API-contract types, the workflow labels, request-status presentation copy, Japanese date formatting, and UI event handling. The status-copy switch was especially easy to miss when adding a backend request state.

The review refactor separates these responsibilities without changing the UI hierarchy or API behaviour:

- `app/features/admin/types.ts`: shared session, access-request, status, and decision contracts.
- `app/features/admin/portal-presentation.ts`: UI-only workflow labels, exhaustive status copy (`satisfies Record<AccessRequestStatus, ...>`), and Japan-time date formatting.
- `AdminPortal.vue`: retains rendering, local dialog state, and focus handling only.
- `tests/unit/admin-portal-presentation.test.ts`: locks the three-step sequence, every request-state label, and the initial application invitation.

The existing compact scoped CSS was intentionally not mechanically reformatted: doing so would create a large, review-hostile visual diff unrelated to PR #24.

## Verification

- `pnpm lint`
- `pnpm typecheck`
- `pnpm test` — 31 tests passed
- `pnpm build`
- `git diff --check`
