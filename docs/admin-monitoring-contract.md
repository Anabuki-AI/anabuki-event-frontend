# Admin console: API status contract

Status: Rails `AdminApiStatus` is the canonical contract. This frontend integration is opt-in and **off by default**. Enable it only after the deployment's provider configuration and authenticated proxy path have been verified.

## Boundary and activation

- Endpoint: `GET /api/admin/api-status`, through the existing same-origin Nuxt API proxy.
- Browser sends its existing HttpOnly admin-session cookies. Backend must enforce a management session and any additional monitoring-read permission.
- Only the backend calls **Atlassian Statuspage** / **Datadog**, stores credentials, determines aggregation windows, and resolves provider-specific errors.
- Never expose API keys, upstream authentication responses, unfiltered errors, or private dashboard URLs in this payload.
- Response must use `Cache-Control: no-store` (the existing Nuxt proxy also applies this).
- After verifying this contract in the target deployment, set `NUXT_PUBLIC_ADMIN_MONITORING_ENABLED=true`. The default is `false`; when disabled, the UI sends **zero requests** to the API-status endpoint and shows explicitly unconfigured providers.
- This switch is presentation configuration, **not authorization**. Backend authorization is mandatory regardless of the switch.
- The frontend uses a 10-second request timeout, no automatic retries, and a deliberate refresh button. It clears previous results while updating or after an error, rather than presenting stale green success as current.

## JSON schema shape

The wire types and fail-closed runtime validator live in `app/admin/monitoring-contract.ts`. The parser accepts exactly one `statuspage` and one `datadog` provider, then `toMonitoringView` creates the separate UI model without inventing values.

```ts
interface MonitoringSnapshotWire {
  generatedAt: string
  cached: boolean
  providers: MonitoringProviderWire[]
}
interface MonitoringProviderWire {
  provider: 'statuspage' | 'datadog'
  source: string
  state: 'available' | 'partial' | 'unconfigured' | 'error'
  fetchedAt: string | null
  availability: {
    state: 'available' | 'unavailable' | 'not_provided'
    value: 'operational' | 'degraded' | 'partial_outage' | 'major_outage' | 'unknown' | null
    externalStatus?: string | null
  }
  metrics: {
    errorRate: MonitoringMetricWire // unit: 'percent'
    responseTime: MonitoringMetricWire // unit: 'milliseconds'
  }
  issue?: { code: string; message: string } | null
}
interface MonitoringMetricWire {
  state: 'available' | 'unconfigured' | 'unavailable' | 'error' | 'not_provided'
  value: number | null
  unit: 'percent' | 'milliseconds'
  observedAt?: string | null
  fetchedAt?: string | null
  issue?: { code: string; message: string } | null
}
```

`available` metrics contain a finite number, including a valid `0`; every other metric state has `value: null`. The UI labels metric states separately as **未設定**, **データなし**, **提供なし**, and **取得失敗**. There is no `updatedAt`, browser/server `stale` flag, or aggregation `windowLabel` in this contract, so the frontend never creates one.

Freshness is client-side only: provider availability uses its `fetchedAt`; a metric uses `observedAt` when supplied, otherwise its own `fetchedAt`. Values older than five minutes are labelled historical and recalculated every 30 seconds. A cache hit preserves the original timestamps; `cached: true` is metadata, not a freshness verdict.

## Transport state versus provider state

| Situation | HTTP / source state | UI behavior |
|---|---|---|
| No admin session | HTTP 401 | Clear monitoring results, recheck session, return to login when expired |
| Admin lacks monitoring-read permission | HTTP 403 | Permission-denied panel; do not log out an otherwise valid admin |
| Backend unavailable / timeout / invalid schema | failure | Fetch-failed panel + manual retry; never claim the service is down |
| Provider unconfigured | HTTP 200, provider `unconfigured` | Explicitly unconfigured provider card |
| Provider failure | HTTP 200, provider `error` | Preserve the other provider's result and display the generic issue |
| One Datadog metric fails | HTTP 200, provider `partial`, metric `error` | Render any available metric and the failed metric separately |
| No metric sample | HTTP 200, metric `unavailable` | Display 「データなし」, never 0 |
| Status information omitted | HTTP 200, availability `not_provided` | Display 「稼働状況は提供なし」 independently of metrics |
| Partial outage | HTTP 200, availability `available/partial_outage` | Warning tone; this is not a transport/auth error |
| Old fetch or observation | age >5m from `fetchedAt` / `observedAt` | Historical label, not current health |
| Fresh operational availability | availability `available/operational` | Green **provider-specific** status only |

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
