# Admin console: external monitoring contract (frontend proposal)

Status: **frontend implemented; backend work is separate (Terra)**. No Rails files are changed by this PR. The provider integration below is opt-in and off by default. Confirm this contract with the backend implementation before enabling it.

## Boundary and activation

- Proposed endpoint: `GET /api/admin/monitoring`, through the existing same-origin Nuxt API proxy.
- Browser sends its existing HttpOnly admin-session cookies. Backend must enforce a management session and any additional monitoring-read permission.
- Only the backend calls **Atlassian Statuspage** / **Datadog**, stores credentials, determines aggregation windows, and resolves provider-specific errors.
- Never expose API keys, upstream authentication responses, unfiltered errors, or private dashboard URLs in this payload.
- Response must use `Cache-Control: no-store` (the existing Nuxt proxy also applies this).
- After deploying this contract, set the frontend runtime variable `NUXT_PUBLIC_ADMIN_MONITORING_ENABLED=true`. The default is `false`; when disabled, the UI makes **no call to a nonexistent endpoint** and shows two explicitly unconfigured sources.
- This switch is presentation configuration, **not authorization**. Backend authorization is mandatory regardless of the switch.
- The frontend uses a 10-second request timeout, no automatic retries, and a deliberate refresh button. It clears previous results while updating or after an error, rather than presenting stale green success as current.

## JSON schema shape

The canonical frontend types and runtime validation live in `app/features/admin/monitoring-contract.ts`.

```ts
interface MonitoringSnapshot {
  // Exactly one of each known provider, even when one is unconfigured or fails.
  sources: MonitoringSource[]
}
interface MonitoringSource {
  provider: 'statuspage' | 'datadog'
  state: 'unconfigured' | 'unauthenticated' | 'forbidden' | 'error' | 'ready'
  condition: 'operational' | 'degraded' | 'partial_outage' | 'major_outage' | 'unknown'
  fetchedAt: string | null // RFC3339: when the backend fetched this observation
  updatedAt: string | null // RFC3339: provider observation/update time
  stale: boolean
  metrics: {
    errorRatePercent: number | null // finite, 0..100; null ≠ 0
    responseTimeMs: number | null // finite, >= 0; null ≠ 0
    windowLabel: string | null // required when either metric exists
  }
}
```

For `ready`, both timestamps are required. A metric requires an explicit `windowLabel` describing the actual aggregation window/statistic, e.g. the chosen percentile or average, period, and time range. If no relevant metric exists (common for Statuspage), return `null`; do not synthesize one from an incident count or the browser health probe. The backend must set `stale` for known delayed/invalid observations. The UI additionally treats `fetchedAt` older than five minutes as historical, recalculating every 30 seconds while mounted. `updatedAt` can legitimately be old for an unchanged Statuspage incident feed; frontend freshness therefore uses **fetchedAt**, not last incident change time.

For non-`ready` states, the UI does not render any supplied metrics/condition as current. Prefer `condition: 'unknown'` and null metrics. Last successful timestamps may be returned for context. Distinguish true absence of configuration from provider authentication failure.

## Transport state versus provider state

| Situation | HTTP / source state | UI behavior |
|---|---|---|
| No admin session | HTTP 401 | Clear monitoring results, recheck session, return to login when expired |
| Admin lacks monitoring-read permission | HTTP 403 | Permission-denied panel; do not log out an otherwise valid admin |
| Backend unavailable / timeout / invalid schema | failure | Fetch-failed panel + manual retry; never claim the service is down |
| Statuspage/Datadog not configured | HTTP 200, source `unconfigured` | Explicitly unconfigured provider card |
| Provider credentials invalid/expired | HTTP 200, source `unauthenticated` | Provider-authentication message; Google relogin is not suggested as a fix |
| Provider read permission missing | HTTP 200, source `forbidden` | Provider permission message |
| One provider fails | HTTP 200, that source `error` | Preserve the other provider's result in its own card |
| Partial outage | HTTP 200, source `ready`, condition `partial_outage` | Text + warning tone; not a transport/auth error |
| Successful but stale observation | source `ready`, `stale: true` or fetch age >5m | Historical label, neutral tone, explicit warning that current health is unknown |
| Fresh operational observation | source `ready`, `operational` | Green **provider-specific** status, with both timestamps |

No overall all-green badge is derived from just one successful source. The two sources remain independent so partial provider failure and partial service outage cannot be conflated. Extending providers requires updating the explicit union, runtime validator, labels, and tests.

## Separate local liveness check

`GET /api/admin/service-health` is a **frontend Nitro route**, forwarding only the existing public Rails `GET /health`, with a five-second upstream timeout, no retries, no redirects, no credentials, fixed target, and no-store caching. This does **not** change the backend. The browser only invokes it on “疎通を確認”.

The measured duration is explicitly **browser → Nuxt → Rails → browser round-trip time** for one call, not Datadog server latency, an error-rate sample, an availability percentage, a DB readiness test, or external-provider health. Failed networking is “確認できません”, not a fabricated outage verdict.

## Other backend-dependent console areas

### Audit logs

Current Rails routes expose no audit-log endpoint. The UI contains the requested columns, a clearly marked integration empty state, and a description of the forthcoming capability. A future response should include stable entry ID, operation text/type, actor identity, event timestamp, pagination cursor, and snapshot/fetch time; distinguish an empty successful result from unauthorized, forbidden, loading, failed, or stale results. Backend must define log retention, read permission, redaction, and filters before a search UI is enabled. This PR intentionally does not intercept console messages or fabricate a client-only audit trail.

### Roles / user list

Existing `GET /api/admin/allowed-emails` returns `{ id: string | null, email, source: 'ENVIRONMENT_ACCESS' | 'MANAGEMENT_ACCESS', active: boolean }[]`. It is a management-access list, **not all users**. `source` describes how access was granted, not “管理者” versus “運営”. The UI preserves that distinction.

Existing approval/rejection APIs remain operational; approval grants management access, not a chosen new role. A future role API needs explicit role values and a server-computed allowed-transition/capability model, protection against self-lockout / removing the last administrator, concurrency conflict behavior, confirmation, and audit logging. Until that contract exists, no role select, role write request, optimistic success, or guessed role is offered. The existing revoke endpoint is deliberately not repurposed as a role change.
