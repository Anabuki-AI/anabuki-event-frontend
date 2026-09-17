// Canonical frontend/backend boundary for GET /api/admin/audit-logs.
// Defined by docs/audit-log-contract.md (frontend PR #47). The backend owns the
// enum; the frontend owns the Japanese labels. Unknown event types must fail
// validation here and render the fetch-failed state, never an empty table.

export type AuditLogType =
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

const AUDIT_LOG_TYPES = [
  'ADMIN_LOGIN_SUCCEEDED', 'ADMIN_LOGGED_OUT', 'ADMIN_ACCESS_EXCHANGED',
  'QUESTION_CREATED', 'QUESTION_UPDATED', 'QUESTION_DELETED',
  'CONFIDENCE_MULTIPLIER_UPDATED', 'ACCESS_REQUEST_APPROVED', 'ACCESS_REQUEST_REJECTED',
  'MANAGEMENT_ACCESS_REVOKED', 'OPERATOR_ACCESS_GRANTED', 'OPERATOR_ACCESS_REVOKED',
] as const satisfies readonly AuditLogType[]

export interface AuditLogEntry {
  id: string
  type: AuditLogType
  actorEmail: string | null
  actorGoogleSub: string | null
  targetType: string | null
  targetId: string | null
  detail: Record<string, string | number | boolean | null>
  occurredAt: string
}

export interface AuditLogPage {
  entries: AuditLogEntry[]
  page: number
  perPage: number
  totalEntries: number
}

export const auditLogTypeLabels: Record<AuditLogType, string> = {
  ADMIN_LOGIN_SUCCEEDED: '管理者ログイン成功',
  ADMIN_LOGGED_OUT: '管理者ログアウト',
  ADMIN_ACCESS_EXCHANGED: '管理アクセスへの切替',
  QUESTION_CREATED: '問題の作成',
  QUESTION_UPDATED: '問題の更新',
  QUESTION_DELETED: '問題の削除',
  CONFIDENCE_MULTIPLIER_UPDATED: '信頼度倍率の更新',
  ACCESS_REQUEST_APPROVED: '利用申請の承認',
  ACCESS_REQUEST_REJECTED: '利用申請の却下',
  MANAGEMENT_ACCESS_REVOKED: '管理アクセスの取消',
  OPERATOR_ACCESS_GRANTED: 'オペレーター権限の付与',
  OPERATOR_ACCESS_REVOKED: 'オペレーター権限の取消',
}

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function optionalString(value: unknown): value is string | null {
  return value === null || typeof value === 'string'
}

function scalarDetail(value: unknown): value is Record<string, string | number | boolean | null> {
  return record(value) && Object.values(value).every(item => item === null || typeof item === 'string' || typeof item === 'number' || typeof item === 'boolean')
}

function rfc3339(value: unknown): value is string {
  return typeof value === 'string' && Number.isFinite(Date.parse(value))
}

// Fail closed on a malformed or extended contract. An unknown type or a missing
// field renders the fetch-failed state; nothing is coerced or dropped silently.
export function parseAuditLogPage(value: unknown): AuditLogPage {
  if (!record(value) || !Array.isArray(value.entries)) throw new Error('Invalid audit log page')
  const entries = value.entries.map((entry): AuditLogEntry => {
    if (!record(entry) || typeof entry.id !== 'string' || !AUDIT_LOG_TYPES.includes(entry.type as AuditLogType)
      || !optionalString(entry.actorEmail) || !optionalString(entry.actorGoogleSub)
      || !optionalString(entry.targetType) || !optionalString(entry.targetId)
      || !scalarDetail(entry.detail) || !rfc3339(entry.occurredAt)) {
      throw new Error('Invalid audit log entry')
    }
    return { id: entry.id, type: entry.type as AuditLogType, actorEmail: entry.actorEmail, actorGoogleSub: entry.actorGoogleSub, targetType: entry.targetType, targetId: entry.targetId, detail: entry.detail, occurredAt: entry.occurredAt }
  })
  if (!Number.isInteger(value.page) || (value.page as number) < 1
    || !Number.isInteger(value.perPage) || (value.perPage as number) < 1
    || !Number.isInteger(value.totalEntries) || (value.totalEntries as number) < 0) {
    throw new Error('Invalid audit log paging')
  }
  return { entries, page: value.page as number, perPage: value.perPage as number, totalEntries: value.totalEntries as number }
}
