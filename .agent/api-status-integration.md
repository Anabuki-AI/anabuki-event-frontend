# Admin API-status integration — implementation record

## Findings

- Canonical browser request is now `GET /api/admin/api-status` through the existing same-origin `/api` proxy. `adminConsoleApi.monitoring()` keeps `credentials: 'include'`, `retry: 0`, and the existing `timeout: 10000` budget.
- `app/admin/monitoring-contract.ts` now represents the Rails response as a wire contract (`MonitoringSnapshotWire`) and validates it fail-closed. It requires exactly one `statuspage` and one `datadog` provider, validates provider/availability/metric states, matching metric units, finite available values (including `0`), optional metric `observedAt`/`fetchedAt`, optional `{ code, message }` issues, `generatedAt`, and `cached`.
- `toMonitoringView()` is the explicit wire-to-view boundary. It does not add `updatedAt`, `windowLabel`, server `stale`, values, or aggregation metadata that Rails does not provide.
- The status screen has one monitoring panel. It separates provider retrieval state from service availability, retains successful metrics for `partial`, labels metric `unconfigured`/`unavailable`/`not_provided`/`error` as 未設定/データなし/提供なし/取得失敗, and formats supplied timestamps in `Asia/Tokyo`.
- Freshness is browser-only: provider availability is judged from provider `fetchedAt`; a metric is judged from `observedAt`, falling back only to its own `fetchedAt`. A missing or older-than-five-minute timestamp is historical, never fresh. `cached` is displayed as cache metadata only.
- `NUXT_PUBLIC_ADMIN_MONITORING_ENABLED` remains default `false`; off state makes no monitoring request. HTTP 401 triggers session recheck, while 403 is a permission error without logout. Async state writes remain guarded after unmount.

## Relevant Files

### Changed

- `app/admin/monitoring-contract.ts` — Rails wire contract, validator, view conversion, labels, freshness helpers.
- `app/admin/api/admin-console.ts` — `/admin/api-status` request boundary.
- `app/admin/composables/useAdminConsoleData.ts` — validated API-status loading, flag/auth/unmount handling.
- `app/admin/components/AdminConsole.vue` — removes the duplicate legacy api-status panel and loads the single monitoring resource.
- `app/admin/components/MonitoringPanel.vue` — provider/availability/metric-state presentation.
- `tests/unit/admin-monitoring.test.ts` — Rails-shaped fixtures covering provider states, all metric states, partial success, cache hit, old observation, zero/null, malformed schemas, and panel states.
- `tests/unit/admin-console-data.test.ts` — flag-off no-request, schema failure, 401/403, timeout, and unmount tests.
- `tests/unit/admin-api-status-api.test.ts` — request path/options assertion and retired-path guard.
- `docs/admin-monitoring-contract.md`, `README.md`, `.env.example`, `nuxt.config.ts`, `.agent/admin-console.md`, `.agent/check-admin-console.mjs` — contract, activation, and fixture-harness updates.

### Removed

- `app/admin/api-status-contract.ts`, `app/admin/components/ApiStatusPanel.vue`, and `tests/unit/admin-api-status.test.ts` — duplicate parallel contract/panel superseded by the canonical `monitoring-contract.ts` integration.

## Migration / Investigation Notes

### Reproducible verification

All commands below were run from `C:/Users/yuzum/Desktop/anabuki/anabuki-event/frontend/.worktree/fix/admin-api-status-integration` with Node `v22.23.2` from the local pi runtime and Corepack pnpm `10.15.0`.

| Command | Input / result | Exit |
| --- | --- | --- |
| `corepack pnpm install --frozen-lockfile` | Lockfile unchanged; 764 packages installed from the local store; `nuxt prepare` generated types. pnpm reported that `esbuild` and `unrs-resolver` build scripts were ignored by its approval policy. | 0 |
| `corepack pnpm lint` | ESLint: 0 errors, 0 warnings. | 0 |
| `corepack pnpm typecheck` | `nuxt typecheck`: no diagnostics. | 0 |
| `corepack pnpm test` | Vitest: **35 files passed, 194 tests passed**, 0 failures; final run duration 6.93 s. | 0 |
| `corepack pnpm build` | Nuxt production build completed; reported total server output **2.59 MB (658 kB gzip)**. | 0 |
| `git diff --check` | No whitespace errors. | 0 |

An initial install/test attempt using system Node `v20.17.0` and pnpm `9.9.0` failed because the project requires Node `>=22.19.0` and package resolution was incompatible. No source change was made for that failed attempt; switching to the already-installed Node 22.23.2/Corepack pnpm 10.15.0 produced the successful verification above.

### Safety and scope

- No backend files, deployment configuration, provider credentials, cookies, OAuth login, or external Statuspage/Datadog request was touched.
- No real authenticated Rails E2E request was made. The browser fixture harness was updated to the Rails-shaped contract, but Playwright/browser-tool dependencies and an authenticated backend session were not started for this task.
- The runtime feature flag remains OFF, so deploying this commit alone does not begin provider requests.

## Recommended Next Steps

1. In a non-production environment with a management session, run the fixture and real proxy checks for `GET /api/admin/api-status`; confirm cookie forwarding, 401/403 behavior, `Cache-Control: no-store`, and timeout behavior.
2. Confirm deployment-specific Statuspage/Datadog configuration, least-privilege credentials, provider semantics, and real metric units before enabling `NUXT_PUBLIC_ADMIN_MONITORING_ENABLED=true`.
3. Keep the flag OFF or roll it back if either provider’s timestamps, units, or generic issues cannot be verified in the target environment.
