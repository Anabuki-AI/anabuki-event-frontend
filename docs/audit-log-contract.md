# Admin console: audit log contract

Status: **implemented contract**. The Rails backend exposes this schema from `GET /api/admin/audit-logs`; the frontend validates it at runtime and renders the reset receipt when `TOURNAMENT_RESET` entries are returned. The feature flag remains the presentation switch for enabling the existing admin log page.

## Backend logging foundation

The backend stores audit entries in the append-only `audit_logs` table and writes the reset receipt in the same transaction as the destructive operation. The frontend never fabricates, caches, or appends to the trail client-side.

## Boundary and activation

- Endpoint: `GET /api/admin/audit-logs`, through the existing same-origin Nuxt API proxy.
- Browser sends its existing HttpOnly admin-session cookies (`admin_session` / `admin_applicant_session`). The backend guards the endpoint with the existing admin authorization flow.
- Read permission: `MANAGEMENT_PAGE_VIEW`.
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

The canonical frontend types and runtime validation live in `app/features/admin/audit-log-contract.ts`.

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
  targetType: string | null // e.g. "QUESTION", "TOURNAMENT", null for session events
  targetId: string | null // string form of the affected record id
  operationId: string | null // reset operation UUID; null for other events
  operationStartedAt: string | null // RFC3339; non-null for TOURNAMENT_RESET
  operationCompletedAt: string | null // RFC3339; non-null for TOURNAMENT_RESET
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
  | 'TOURNAMENT_RESET'
  | 'PARTICIPANT_DELETED'
  | 'DISPLAY_NAME_REJECTED'
  | 'DISPLAY_NAME_MODERATION_FAILED'
  | 'PARTICIPANT_REGISTERED'
  | 'PARTICIPANT_DISPLAY_NAME_CHANGED'
  | 'PARTICIPANT_LOGGED_OUT'
  | 'ANSWER_SUBMITTED'
  | 'ANSWER_CHANGED'
  | 'CONFIDENCE_LEVEL_SELECTED'
  | 'CONFIDENCE_LEVEL_CHANGED'
  | 'QUIZ_STARTED'
  | 'QUESTION_PUBLISHED'
  | 'LIVE_CORRECT_ANSWER_UPDATED'
  | 'ANSWER_WINDOW_CLOSE_REQUESTED'
  | 'ANSWER_WINDOW_CLOSED'
  | 'ANSWER_REVEALED'
  | 'QUIZ_FINISHED'
  | 'OPERATOR_LOGIN_SUCCEEDED'
  | 'OPERATOR_LOGGED_OUT'
```

Rules:

- `type` is a closed union. Adding a value requires a contract update before the frontend can label it; unknown values received at runtime must fail validation and render the fetch-failed state, not an empty table.
- The backend supplies the enum; the frontend owns the Japanese label mapping (操作内容 column). The backend must not return pre-localized human text as the primary identifier.
- `actorEmail` is always present for admin- and operator-initiated events (`OPERATOR_LOGIN_SUCCEEDED` / `OPERATOR_LOGGED_OUT` and the operator-driven quiz-progression events below). It is `null` for participant-initiated events (`PARTICIPANT_*`, `ANSWER_*`, `CONFIDENCE_LEVEL_*`) and for system-driven events with no human actor (`QUIZ_STARTED`, `ANSWER_WINDOW_CLOSED` when triggered by time-limit expiry) — those identify their subject via `targetType`/`targetId` and `detail` instead.
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

## Events to record

Derived from the current admin/operator-facing routes and participant flows. Each entry is written by the backend **after** the action succeeds; failed attempts are intentionally not logged (except moderation-failure events, which record the failure itself as the event).

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
| `TOURNAMENT_RESET` | `POST /api/operator/quiz/reset` succeeds with exact confirmation `RESET` |
| `PARTICIPANT_DELETED` | `DELETE /api/operator/participants/:id` removes a participant (cascades to their sessions/answers); `detail.displayName` keeps the removed name |
| `DISPLAY_NAME_REJECTED` | a registration or rename is rejected because display-name moderation (Jev) flags it; `detail` carries `displayName`, `probability`, `threshold` |
| `DISPLAY_NAME_MODERATION_FAILED` | the moderation provider could not be reached; `detail.displayName` plus `failClosed` (whether the name was let through or rejected by policy) |
| `PARTICIPANT_REGISTERED` | a participant registration succeeds; `targetType` `PARTICIPANT`; `detail` carries `displayName`, `gender`, `ageGroup`, `studentType`; `actorEmail`/`actorGoogleSub` are `null` (participants have no admin identity) |
| `PARTICIPANT_DISPLAY_NAME_CHANGED` | a participant's display-name change actually changes the value (no-op resubmissions are not logged); `detail` carries `previousDisplayName`, `displayName` |
| `PARTICIPANT_LOGGED_OUT` | a participant explicitly deletes their session; no `detail` |
| `ANSWER_SUBMITTED` | a participant's first answer to a question; `targetType` `PARTICIPANT_ANSWER`; `detail` carries `participantId`, `questionId`, `choice`, `confidenceLevel`, `awardedPoints` |
| `ANSWER_CHANGED` | a participant changes an existing answer (idempotent resubmission of the same value is not logged); `detail` adds `previousChoice`, `previousConfidenceLevel`, `previousAwardedPoints` alongside the new values |
| `CONFIDENCE_LEVEL_SELECTED` | a participant's first confidence-level selection for a question; `targetType` `PARTICIPANT_QUIZ_CONFIDENCE_SELECTION`; `detail` carries `participantId`, `questionId`, `confidenceLevel`, `eliminatedChoice` |
| `CONFIDENCE_LEVEL_CHANGED` | a participant changes an existing confidence-level selection (idempotent resubmission is not logged); `detail` adds `previousConfidenceLevel` alongside the new value |
| `QUIZ_STARTED` | `POST /api/operator/quiz/start` succeeds (`waiting` → `in_progress`); no `detail` |
| `QUESTION_PUBLISHED` | a question first becomes visible to participants, from `start` or `publish`; `targetType` `QUESTION`; `detail` carries `position`, `isRelayQuestion` |
| `LIVE_CORRECT_ANSWER_UPDATED` | the operator sets/changes the live correct answer on a relay question; `detail.correctAnswer` |
| `ANSWER_WINDOW_CLOSE_REQUESTED` | the operator manually starts the answer-window close countdown; no `detail` |
| `ANSWER_WINDOW_CLOSED` | the answer window actually closes (manual countdown elapsed or the time limit expired); `detail.reason` is `operator_requested` or `time_limit_expired`; recorded once at the single model-level choke point every polling path funnels through, so concurrent/repeated polling never double-logs it |
| `ANSWER_REVEALED` | the operator reveals the correct answer; `detail.correctAnswer` (nullable) |
| `QUIZ_FINISHED` | the operator finishes the quiz; `detail.finishedElapsedSeconds` (nullable) |
| `OPERATOR_LOGIN_SUCCEEDED` | Google OAuth callback completes and an operator (manager-source) session is issued; applicant-source logins are not logged, mirroring `ADMIN_LOGIN_SUCCEEDED` |
| `OPERATOR_LOGGED_OUT` | an operator explicitly logs out, mirroring `ADMIN_LOGGED_OUT` |

Deliberately out of scope (candidates for a later contract):

- `GET`-only reads (question list/detail, allowed-email list, access-request list). Logging every read would drown the trail; if read auditing is ever required, add a separate opt-in type (e.g. `AUDIT_LOG_VIEWED`) with its own retention discussion.
- High-frequency, low-significance participant signals: presence/heartbeat polling and emoji reactions (the latter already recorded in a separate, non-durable reaction event store).

## Backend storage notes

The `audit_logs` table contains monotonic `id`, the closed `event_type` enum, actor snapshots, `target_type`, `target_id`, scalar-only `detail`, `occurred_at`, and reset-only `operation_id`, `operation_started_at`, and `operation_completed_at` fields. Reset operation IDs are unique, reset operation metadata is non-null and ordered, and the reset audit row is inserted in the same PostgreSQL transaction as the purge. The admin serializer exposes these fields as `operationId`, `operationStartedAt`, and `operationCompletedAt`; the UI displays them as the reset receipt.
