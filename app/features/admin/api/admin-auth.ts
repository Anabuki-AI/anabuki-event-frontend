import { request } from '~/lib/api/client'

export interface AdminSession {
  email: string
  googleSub: string
  accessSource: 'APPLICANT' | 'MANAGEMENT_ACCESS' | 'ENVIRONMENT_ACCESS'
  permissions: string[]
  expiresAt: string
}

export interface AccessRequest {
  id: number
  email: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED'
  createdAt: string
  expiresAt: string
  cancelledAt: string | null
  cancellationReason: string | null
  decidedAt: string | null
}

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
  decide: (id: number, decision: 'approve' | 'reject') => request<AccessRequest>(`/admin/access-requests/${id}/${decision}`, { method: 'POST', credentials, retry: 0 }),
}
