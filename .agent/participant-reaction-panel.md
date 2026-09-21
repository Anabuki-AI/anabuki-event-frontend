# Participant reaction panel implementation

## Checkout
- Repository: frontend only. Parent repository/main tracked files unchanged.
- Fetched origin, based on origin/main 903342b.
- Branch: feat/participant-reaction-panel
- Worktree: /Users/yuyu/Desktop/anabuki-event/frontend/.worktree/feat/participant-reaction-panel
- Initial implementation had no commit/push. User subsequently explicitly authorized commit and merge to frontend origin/main. No gh usage.
- Read root AGENTS.md and CLAUDE_FRONT.md; no frontend AGENTS.md found.

## Behavior
- Explicit allowlist: /, /help, /rankings, /participants/waiting, /participants/edit, /participants/help (trailing slash normalized).
- /users/answer is excluded regardless of quiz state. Registration, admin, operator, projector and all other paths excluded.
- Client-only participant /me check; no panel during checking/failure. Public 401 never navigates.
- Recheck on allowed route transitions, after registration navigation, window focus and tab visibility restoration. Invalidate on hidden tab and reaction POST 401. Generation counter discards stale responses and unmounted results.
- App-level host; removed waiting-specific stamp UI. WaitingRoom now only controls participant-count animation.
- Same eight stamps and POST API; each click provides local animation immediately, including repeated clicks. 429/network failures remain silent as previously; server 500ms throttle unchanged.
- Closed by default, accessible labeled toggle with expanded state, labeled 44px targets, Escape closes/restores focus, reduced-motion support.
- Safe-area-aware fixed bottom-right dock with bottom document spacer; collapse/hide on editable focus or visual viewport keyboard shrink. No backend/auth subsystem refactor.

## Verification
- pnpm install --frozen-lockfile: pass; ignored dependency build-script warning (esbuild/unrs-resolver/workerd).
- Plain pnpm test <related files>: blocked before collection by OXC TSCONFIG_ERROR resolving ../../../.nuxt/tsconfig.app.json in nested checkout. No outer checkout generated files modified to work around this.
- .agent/vitest-worktree.config.ts imports normal test configuration and disables OXC tsconfig auto-discovery for this environment only; no product config changes.
- pnpm test --config .agent/vitest-worktree.config.ts: PASS, 59 files / 394 tests.
- pnpm typecheck: PASS.
- pnpm lint: PASS.
- git diff --check: PASS.
- pnpm build: BLOCKED by same nested-checkout OXC tsconfig error in existing pages; .agent/build.log contains actual output.
- New panel tests: allowlist/exclusions, all answer states excluded by path, pending/failed/successful checks, no public redirect, race after leave-and-return, allowed-route reset, post-unmount completion, re-focus invalidation, send 401, single host/no waiting duplicate, eight accessible buttons, Escape focus, rapid-click animation/API calls, 429 feedback, editable-focus hiding.

## Merge preparation
- Fetched origin again: origin/main remains 903342b; feature changes are directly based on it, with no integration conflicts.
- Reviewed tracked diff and all new files. Keep this record and the isolated Vitest configuration for reproducibility; exclude generated .nuxt, node_modules and logs from the commit.
- Re-ran full tests (59 files / 394 tests), typecheck, lint and diff --check successfully before commit.
- Use a temporary frontend main worktree for fast-forward integration; preserve the original detached frontend checkout and parent repository state.
- Preserve ignored verification/build logs outside the disposable worktrees under parent .agent/participant-reaction-panel-merge/ before cleanup.

## Not verified
- Physical Android/iPhone safe areas, software keyboard and browser visual layout (only happy-dom component tests).
- Live backend cookie/session flow and projector delivery; backend API unchanged and API unit test passes.
- Production build cannot be certified in this nested checkout until the OXC configuration discovery issue is addressed by the environment.
