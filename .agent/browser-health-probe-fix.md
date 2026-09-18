# Admin browser health probe fix — 2026-09-18

## Findings

- Repository: `Anabuki-AI/anabuki-event-frontend`.
- Branch/worktree: `fix/browser-health-probe` in `tmp/investigate-browser-health/.worktree/fix-browser-health-probe` (the parent checkout is an isolated clone under `tmp/`; the project root and its checked-out submodule were not changed).
- Rules reviewed before investigation: parent `AGENTS.md` and `CLAUDE_FRONT.md`.
- The admin button calls `GET /api/admin/service-health` through `adminConsoleApi.health()`.
- Production read-only observations before the fix:
  - `https://anabuki-event.com/api/admin/service-health` returned HTTP **502** consistently (three samples: 0.090–0.115 s; a later sample: 0.063 s).
  - `https://anabuki-event.com/api/health` returned HTTP **200** with `{ "status": "ok" }` (0.254 s in the recorded sample).
  - `https://api.anabuki-event.com/health` and `https://api.anabuki-event.com/api/health` both returned HTTP **200** with `{ "status": "ok" }` (0.247–0.266 s in the recorded samples).
- Therefore Rails and the ordinary `/api/**` tunnel proxy were healthy while the dedicated service-health Worker route alone failed.
- The dedicated route had drifted from the working production proxy contract: it issued a bare Worker `fetch(URL, { redirect: "error" })` to `/health`, whereas `server/api/[...path].ts` uses a Request-shaped, API-prefixed tunnel request. Its blanket catch intentionally reduced every upstream status/runtime exception to the observed 502, so the production response does not expose a more specific internal exception without Worker logs.

## Change

- `server/api/admin/service-health.get.ts`
  - Uses the backend's public `GET /api/health` contract in Cloudflare Tunnel, service-binding fallback, and local Node paths.
  - Constructs the tunnel call with `createBackendRequest`, matching the proven `/api/**` Worker request shape.
  - Continues to omit browser cookies, Origin, Host, and arbitrary target input.
- `tests/unit/admin-service-health.test.ts`
  - Covers tunnel URL/request shape and credential omission.
  - Covers the service-binding fallback and local Node URL.
- `app/admin/components/AdminConsole.vue` and `README.md`
  - Update the displayed/documented endpoint from `/health` to `/api/health`.

## Verification record

All successful commands used Node `v22.23.2` from the pi runtime and Corepack pnpm `10.15.0`.

| Command / input | Expected | Measured result | Exit |
| --- | --- | --- | --- |
| `corepack pnpm install --frozen-lockfile` | Reproducible install | 784 packages; lockfile unchanged; Nuxt types generated | 0 |
| `corepack pnpm exec vitest run tests/unit/admin-service-health.test.ts tests/unit/cloudflare-backend.test.ts` | Route and shared request tests pass | 2 files, 8 tests passed | 0 |
| `corepack pnpm lint` | No ESLint diagnostics | No diagnostics | 0 |
| `corepack pnpm typecheck` | No TypeScript diagnostics | No diagnostics | 0 |
| `corepack pnpm test` | Full suite passes | 51 files, 294 tests passed after rebasing onto latest `origin/main` (`8055609`) | 0 |
| `corepack pnpm build` | Cloudflare-module production build succeeds | Build complete; total Nitro output 978 kB (323 kB gzip) | 0 |
| Local `wrangler dev --config wrangler.jsonc --port 8787`, then `GET /api/admin/service-health` | Worker route reaches the configured real public health endpoint without credentials | HTTP 200, `Cache-Control: no-store`, `{ "status": "ok" }`; Wrangler recorded route duration 566 ms | 0 |
| `git diff --check` | No whitespace errors | No output | 0 |

### Discarded/adjusted attempt

The first Windows-local Vitest invocation failed before collecting tests because Vite/OXC resolved Nuxt's generated project-reference path as `../../.nuxt/tsconfig.app.json` from the nested worktree and reported it missing (exit 1; 0 tests). This affected unchanged tests too. For the reproducible local run only, the generated `.nuxt` directory was copied to the corresponding isolated parent-clone location under `tmp/`; no tracked file changed. The targeted and full suites then passed as recorded above. Linux CI remains the authoritative clean-checkout run.

## Safety

- Only public read-only health endpoints were called; no cookies, tokens, API keys, user records, or mutation requests were sent.
- No backend, database, DNS, OAuth, Cloudflare secret, or migration change is required.
- The route still accepts no caller-provided target and still masks backend details in errors.
