# Admin console: audit log contract (frontend proposal)

Status: **contract proposal only**. No Rails files and no frontend API wiring are changed by this PR. The backend implementation (C2) must confirm this contract before the frontend connects (C3). Until then, the console keeps showing its explicit "データ未連携" empty state and makes **no call** to a nonexistent endpoint.

## Existing logging foundation (investigation result)

The backend currently has **no dedicated audit-log infrastructure**: no audit model or table, no application-level logger utility, and no ActiveRecord history/callback-log tables. The only actor-attribution mechanisms today are the `granted_by` / `granted_at` / `revoked_at` columns on admin and operator access records (an "audit trail" of grants, not a queryable operation log), plus Rails' standard `log/` output and Sentry for error monitoring — neither of which is suitable as a console-searchable audit trail. This contract therefore **proposes a new simple schema** rather than adapting an existing one.

## Boundary and activation

- Proposed endpoint: `GET /api/admin/audit-logs`, through the existing same-origin Nuxt API proxy.
- Browser sends its existing HttpOnly admin-session cookies (`admin_session` / `admin_applicant_session`). The backend must guard the endpoint with the existing `management_session!` flow.
- Read permission: reuse the existing `MANAGEMENT_PAGE_VIEW` permission. This contract intentionally does **not** introduce a new permission value; if the backend wants a dedicated `AUDIT_LOG_READ`, that is a C2 decision to confirm before C3.
- Only the backend writes, stores, redacts, and retains audit entries. The frontend never fabricates, caches, or appends to the trail client-side.
- Response must use `Cache-Control: no-store` (the existing Nuxt proxy also applies this).
- After deploying the backend, set the frontend runtime variable `NUXT_PUBLIC_ADMIN_AUDIT_LOG_ENABLED=true`. The default is `false`; when disabled, the UI makes **no request** and shows the current unconnected state. This switch is presentation configuration, **not authorization**. Backend authorization is mandatory regardless of the switch.
- The frontend uses a 10-second request timeout, no automatic retries, and a manual refresh / pagination controls. It distinguishes an empty successful result from unauthorized, forbidden, loading, failed, or stale results — an empty list must never be presented as "操作履歴なし" in a way that implies nothing has ever happened.

## Query parameters

| Parameter | Type | Default | Constraint |
|---|---|---|---|
| `page` | integer | `1` | `>= 1` |
| `perPage` | integer | `50` | `1..100` |
| `type` | string | (all) | Comma-separated subset of the event type enum below, e.g. `type=QUESTION_DELETED,MANAGEMENT_ACCESS_REVOKED`. Unknown values must be rejected with 400, not silently ignored. |
| `from` | string | (none) | RFC3339 (inclusive), event timestamp lower bound |
| `to` | string | (none) | RFC3339 (inclusive), event timestamp upper bound |

`from` must not be later than `to`; violation is a 400. Ordering is fixed: `occurredAt` descending (newest first). Offset paging is deliberate — the volume for a one-day quiz event is small and the UI needs stable page numbers, not a live cursor.

## Response JSON schema

The canonical frontend types and runtime validation will live in `app/features/admin/audit-log-contract.ts` (C3).

```ts
interface AuditLogPage {
  entries: AuditLogEntry[]
  page: number // echoed request page
  perPage: number // echoed request perPage
  totalEntries: number // total matching the filter, not just this page
}

interface AuditLogEntry {
  id: string // stable, unique, sortable (string form of a monotonic backend id)
  type: AuditLogType // explicit enum, see below
  actorEmail: string | null // null only for system-generated entries; the UI column 実行ユーザー
  actorGoogleSub: string | null
  targetType: string | null // e.g. "QUESTION", "ADMIN_ACCESS_REQUEST", null for session events
  targetId: string | null // string form of the affected record id
  detail: Record<string, string | number | boolean | null> // presentation-safe, redacted; never credentials, cookies, session keys, or raw OAuth responses
  occurredAt: string // RFC3339 with offset; the UI renders it as 日本時間
}

type AuditLogType =
  | 'ADMIN_LOGIN_SUCCEEDED'
  | 'ADMIN_LOGGED_OUT'
  | 'ADMIN_ACCESS_EXCHANGED'
  | 'QUESTION_CREATED'
  | 'QUESTION_UPDATED'
  | 'QUESTION_DELETED'
  | 'CONFIDENCE_MULTIPLIER_UPDATED'
  | 'ACCESS_REQUEST_APPROVED'
  | 'ACCESS_REQUEST_REJECTED'
  | 'MANAGEMENT_ACCESS_REVOKED'
  | 'OPERATOR_ACCESS_GRANTED'
  | 'OPERATOR_ACCESS_REVOKED'
```

Rules:

- `type` is a closed union. Adding a value requires a contract update before the frontend can label it; unknown values received at runtime must fail validation and render the fetch-failed state, not an empty table.
- The backend supplies the enum; the frontend owns the Japanese label mapping (操作内容 column). The backend must not return pre-localized human text as the primary identifier.
- `actorEmail` is always present for admin-initiated events. Operator-session events are out of scope for phase 1 (see below).
- `detail` may include small, safe context (e.g. `questionId`, `level`, `requestId`). It must never include participant personal data beyond what is already shown elsewhere, file contents, image blobs, or any secret.

## Error responses

Errors reuse the existing backend shape `{ "error": "<message>" }`.

| Situation | HTTP | UI behavior |
|---|---|---|
| No admin session / expired | 401 | Recheck session, return to login when expired |
| Applicant-only session or missing permission | 403 | Permission-denied panel; do not log out an otherwise valid admin |
| Invalid query parameter | 400 | Inline message naming the offending parameter; keep previous results visible but marked stale |
| Backend not yet deployed / endpoint absent | 404 or proxy failure | Feature-unavailable state, identical in tone to the current 未連携 state; never presented as "0 件" |
| Backend unavailable / timeout / invalid schema | failure | Fetch-failed panel + manual retry; never claim "エラー0件" |

## Events to record (phase 1 scope)

Derived from the current admin-facing routes and flows. Each entry is written by the backend **after** the action succeeds; failed attempts are intentionally not logged in phase 1.

| Event type | Trigger (existing implementation) |
|---|---|
| `ADMIN_LOGIN_SUCCEEDED` | Google OAuth callback completes and a management session is issued (`AdminAuth#complete_oauth!`, sources `ENVIRONMENT_ACCESS` / `MANAGEMENT_ACCESS`) |
| `ADMIN_LOGGED_OUT` | `POST /api/admin/auth/logout` |
| `ADMIN_ACCESS_EXCHANGED` | `POST /api/admin/auth/exchange` (applicant session upgraded to management access after approval) |
| `QUESTION_CREATED` | `POST /api/admin/questions` |
| `QUESTION_UPDATED` | `PUT /api/admin/questions/:id` |
| `QUESTION_DELETED` | `DELETE /api/admin/questions/:id` |
| `CONFIDENCE_MULTIPLIER_UPDATED` | `PATCH /api/admin/confidence-multipliers/:level` |
| `ACCESS_REQUEST_APPROVED` | `POST /api/admin/access-requests/:id/approve` |
| `ACCESS_REQUEST_REJECTED` | `POST /api/admin/access-requests/:id/reject` |
| `MANAGEMENT_ACCESS_REVOKED` | `DELETE /api/admin/allowed-emails/:id` |
| `OPERATOR_ACCESS_GRANTED` | `PATCH /api/admin/operator-identities/:id` with manager access enabled |
| `OPERATOR_ACCESS_REVOKED` | `PATCH /api/admin/operator-identities/:id` with manager access revoked |

Deliberately out of scope for phase 1 (candidates for a later contract, listed so C2 can leave room):

- `GET`-only reads (question list/detail, allowed-email list, access-request list). Logging every read would drown the trail; if read auditing is ever required, add a separate opt-in type (e.g. `AUDIT_LOG_VIEWED`) with its own retention discussion.
- Operator quiz lifecycle actions (`/api/operator/quiz/*`) and participant activity: these run under operator/participant sessions with a different actor model; they need their own actor field semantics before entering the same table.

## Proposed backend schema (for C2 to confirm)

A single append-only table, e.g. `audit_logs`: monotonic `id` (bigint), `type` (string), `actor_identity_id` (nullable FK to `admin_identities`), `actor_email`, `actor_google_sub`, `target_type`, `target_id`, `detail` (jsonb), `occurred_at` (timestamp with time zone), written in the same transaction as the action where practical. Retention, index design (at minimum `(occurred_at)` and `(type, occurred_at)`), and whether writes wrap in a transaction are backend decisions; this contract only requires that an accepted write corresponds to a succeeded action and that reads never expose the table's raw internals beyond the schema above.
