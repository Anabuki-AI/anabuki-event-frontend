import { request } from '~/lib/api/client'
import type {
  AccessRequest,
  AccessRequestDecision,
  AdminSession,
} from '../types'

export type { AccessRequest, AccessRequestDecision, AdminSession } from '../types'

// Credentials stay in the backend's HttpOnly cookies, never in browser storage.
const credentials = 'include' as const

export const adminAuthApi = {
  configuration: () => request<{ configured: boolean }>('/auth/google/status', { credentials }),
  session: () => request<AdminSession>('/admin/auth/session', { credentials }),
  ownRequest: () => request<AccessRequest | undefined>('/admin/access-request', { credentials }),
  apply: () => request<AccessRequest>('/admin/access-request', { method: 'POST', credentials, retry: 0 }),
  exchange: () => request<undefined>('/admin/auth/exchange', { method: 'POST', credentials, retry: 0 }),
  logout: () => request<undefined>('/admin/auth/logout', { method: 'POST', credentials, retry: 0 }),
  pendingRequests: () => request<AccessRequest[]>('/admin/access-requests', { credentials }),
  decide: (id: number, decision: AccessRequestDecision) => request<AccessRequest>(`/admin/access-requests/${id}/${decision}`, { method: 'POST', credentials, retry: 0 }),
  pendingOperatorRequests: () => request<AccessRequest[]>('/admin/operator-access-requests', { credentials }),
  decideOperatorRequest: (id: number, decision: AccessRequestDecision) => request<AccessRequest>(`/admin/operator-access-requests/${id}/${decision}`, { method: 'POST', credentials, retry: 0 }),
}
