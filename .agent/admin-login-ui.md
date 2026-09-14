# Admin login UI — implementation handoff

## Request and workspace

User: admin login UI を追加する。既存の申請・認証の方式を調査して最適化する。既存の他 UI の見た目は踏襲せず、Astra に独立した良い UI を実装させる。

Implementation model reported by `PI_MODEL`: `gpt-6-astra`.

- Repository: `Anabuki-AI/anabuki-event-frontend`
- Branch: `feat/admin-login-ui`
- Worktree: `/Users/yusei.iwase.01/Desktop/jsutforfun_student/anabuki-event/frontend/.worktree/feat/admin-login-ui`
- Created after `git fetch origin main`, based on `ea1ed83` (frontend main).
- Backend inspected: main `ee6037c`.
- No commits, staging, pushes, PRs, or changes to backend/docs. No branch was created in the parent anabuki-event repository. Root frontend remains main; all implementation is inside this worktree.

## Findings: use the real contract, not a password form

Sources:
- Parent `CLAUDE_FRONT.md`: admin is PC-oriented; main blue `#1769c2`; body 16px, notes 12–14px.
- Frontend `app/pages`, `app/features`, `app/lib/api/client.ts`: no existing admin route, auth form, middleware, or application UI. Nuxt 4 feature-based structure and normalized `ApiError` already exist.
- Backend `README.md`, `app/controllers/{google_auth,admin_auth,access_requests}_controller.rb`, `app/services/admin_auth.rb`, `app/models/admin_access_request.rb`.
- docs repository only has a placeholder README; backend main is the source of truth for the flow.

Contract:
1. `GET /api/auth/google/status` returns `{ configured }`.
2. Top-level browser navigation to `/api/auth/google/start` sets device/state cookies and redirects to Google. It must NOT be an XHR login.
3. Successful callback redirects to configured `ADMIN_FRONTEND_URL`, default `/admin`.
4. `GET /api/admin/auth/session` returns `email`, `googleSub`, `accessSource`, `permissions`, `expiresAt`; unauthenticated is 401.
5. First-time Google identities are `APPLICANT`. `GET /api/admin/access-request` returns 204 for no request, otherwise the latest device/session-bound request.
6. `POST /api/admin/access-request` takes no form body. Email is verified by Google, not user-editable. Explicit consent/action is required; login does not silently send an application.
7. Requests are `PENDING`, `APPROVED`, `REJECTED`, `CANCELLED`. Application lifetime is bound to the applicant session (20 minutes from login).
8. After approval, `POST /api/admin/auth/exchange` returns 204, rotates the session cookie, and requires the original device/session pair. Re-read the session; never synthesize management permission on the client.
9. Approved returning accounts and `ADMIN_EMAIL_ALLOWLIST` environment access can enter directly. Management sessions live 8 hours.
10. Logout/re-login/revocation cancels pending requests. All identities/tokens remain in backend HttpOnly cookies, never localStorage.
11. Management permission `ACCESS_REQUEST_APPROVE` authorizes `GET /api/admin/access-requests` and `POST /api/admin/access-requests/:id/{approve,reject}`.
12. Mutation APIs validate Origin. Keep browser requests same-origin and preserve the browser Origin when proxying.

The participant frontend still refers to an old users API that backend main removed. This pre-existing mismatch is OUT OF SCOPE; participant screens were deliberately not changed.

## Implemented UX

Routes: `/admin` and alias `/admin/login`.

- Independent, scoped design: quiet sage editorial panel, typographic Japanese headline, custom CSS Q/A cards, white task-focused login panel, restrained blue accents. No copied legacy cards, CSS framework, external font/image, or new application dependency.
- One recognizable Google sign-in action. Clear first-time-user explanation and an expandable explanation of account/session binding, the 20-minute limit, and returning administrators.
- Three steps communicate Login → Application → Start operations; returning admins skip the application step.
- Real loading, OAuth unconfigured, connection failure/retry, OAuth cancellation/failure, applicant, pending, approved, rejected, cancelled, and management states.
- Pending applications refresh every 10s, pause in hidden tabs, stop retrying after network errors, resume on explicit retry, and clean up timers/listeners on unmount.
- Approval changes are announced through a live status region. Explicit application/exchange/logout transitions focus the new heading. Polling does not steal keyboard focus.
- Expired sessions are revalidated and return to Google login; 403 never grants local authority; 409 offers a state refresh. Duplicate submissions are blocked.
- Applicant email, request number and Japan-time expiry are shown for communication with the administrator. Account switching/logout has a confirmation and warns about cancelling pending requests.
- A minimal real management landing page shows the current verified account and a permission-gated application inbox. Approval/rejection needs confirmation. This is intentionally not a fake event dashboard and does not claim that unrelated management features exist.
- PC-first layout reflows at narrow widths, preserves 44px+ controls, has a skip link/focus rings, noindex/no-store, and reduced-motion support. Footer clearly identifies PC as the management target.

## API transport change

`server/api/[...path].ts` replaces the dev-only Nitro proxy with a runtime-configured same-origin proxy in development AND production.

- Uses existing `backendBaseUrl` runtime configuration; upstream destination is fixed by server configuration, never supplied by browser input.
- Preserves request method/body/Origin/Cookie and all Set-Cookie responses.
- Uses manual redirects so Google navigation remains in the browser, not on the Nuxt server.
- Overrides upstream cache headers with `no-store`.
- OAuth start/callback failures redirect to fixed `/admin/login?auth_error=google`. The UI uses a fixed Japanese message; backend error details, OAuth code, state, and tokens are not echoed in the error URL.
- Other API errors remain API errors for the existing normalized error handling.
- Generic `/api` proxying also preserves the former development behavior for other feature APIs; their UI and API client were not changed.

## Deployment / real Google verification

Frontend:
```dotenv
NUXT_BACKEND_BASE_URL=http://localhost:8080
NUXT_PUBLIC_API_BASE=/api
```
Backend:
```dotenv
PUBLIC_BASE_URL=http://localhost:3000
ADMIN_FRONTEND_URL=http://localhost:3000/admin
GOOGLE_OAUTH_CALLBACK_URL=http://localhost:3000/api/auth/google/callback
```
Register that exact callback in Google Cloud Console. Keep Google client ID/secret and allowlist in BACKEND configuration only; never expose secrets through `NUXT_PUBLIC_*`. Production uses the corresponding HTTPS URLs.

Using the frontend-origin callback ensures error recovery goes through the new proxy. An existing direct-backend callback such as `localhost:8080/api/auth/google/callback` can still work on the same hostname, but backend callback failures will display the backend response rather than the frontend recovery screen. Cross-site cookies are not a supported alternative; keep `/api` same-origin.

No real Google account or deployment secret was used, and no environment file was changed. A real Google round-trip with one allowed admin and one new applicant remains the deployment acceptance check. `localhost:8080/health` returned 404 in this environment, so browser verification used an isolated API fixture rather than claiming to exercise live Rails.

## Validation

- `pnpm install --frozen-lockfile`: passed; lockfile unchanged.
- `pnpm lint`: passed.
- `pnpm typecheck`: passed.
- `pnpm test`: 25 tests passed (23 new lifecycle tests plus 2 existing API error tests).
- `pnpm build`: passed; only Vite plugin timing advisory, no build errors.
- Production Chromium smoke: `node .agent/browser-check.mjs` after build.
  - Real built Nuxt server + isolated contract-faithful mock Rails HTTP server, NOT a mocked Vue render.
  - OAuth redirect and multiple HttpOnly cookies, no-store, callback error recovery.
  - Login alias and Google URL; 320/390/768/1024/1440px horizontal-overflow checks.
  - Unconfigured status, service failure/retry, application → pending → approval → cookie exchange → management.
  - Origin and Cookie forwarded on POST; management approval confirmation; logout confirmation and cookie deletion.
  - 11 states checked with axe WCAG 2 A/AA and WCAG 2.1 AA tags: zero detected violations. Initial low-contrast decorative/footer text was fixed and rechecked.
  - No browser runtime errors.
- Browser output: `.agent/browser-report.json`.
- Screenshots: `.agent/screenshots/{login-desktop,login-mobile,application-pending,management-inbox}.png`.
- Build log: `.agent/build.log` (git-ignored).

The browser test tooling lives only under `.agent/browser-tools` (git-ignored) and does not modify package.json/pnpm-lock.yaml. To reproduce if tools are absent:
```bash
npm install --prefix .agent/browser-tools --no-package-lock playwright @axe-core/playwright
.agent/browser-tools/node_modules/.bin/playwright install chromium
pnpm build
node .agent/browser-check.mjs
```
The script starts temporary servers on 18080/18081 and shuts them down on completion.

## Changed source files

- `app/pages/admin/index.vue`: route/alias, title, noindex.
- `app/features/admin/api/admin-auth.ts`: typed API contract and credentialed calls.
- `app/features/admin/composables/useAdminPortal.ts`: session/application lifecycle.
- `app/features/admin/components/AdminPortal.vue`: complete login/application/management surface, scoped styling.
- `app/features/admin/components/PortalIcon.vue`: small shared inline icon vocabulary.
- `server/api/[...path].ts`: development/production same-origin API/OAuth proxy.
- `nuxt.config.ts`: remove dev-only proxy, mark admin routes no-store.
- `tests/unit/admin-portal.test.ts`: lifecycle regression coverage.
- `.env.example`, `README.md`: current Rails transport and OAuth deployment setup.
- `.agent/`: this handoff, smoke test/report/screenshots; tools excluded locally.
