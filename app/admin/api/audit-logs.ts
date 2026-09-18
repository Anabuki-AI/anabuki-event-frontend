import { request } from '~/lib/api/client'
import type { AuditLogType } from '~/features/admin/audit-log-contract'

export interface AuditLogQuery {
  page: number
  perPage: number
  types?: AuditLogType[]
  from?: string
  to?: string
}

// GET /api/admin/audit-logs — guarded server-side by MANAGEMENT_PAGE_VIEW.
// Same contract options as the other admin reads: session cookies, no retry,
// 20-second timeout, no-store (contract + proxy requirement).
export const auditLogApi = {
  page: (query: AuditLogQuery) => request<unknown>('/admin/audit-logs', {
    credentials: 'include',
    retry: 0,
    timeout: 20000,
    query: {
      page: query.page,
      perPage: query.perPage,
      ...(query.types?.length ? { type: query.types.join(',') } : {}),
      ...(query.from ? { from: query.from } : {}),
      ...(query.to ? { to: query.to } : {}),
    },
  }),
}
