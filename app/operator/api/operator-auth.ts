import { request } from '~/lib/api/client'
import type { AccessRequest, OperatorSession } from '../types'

export type { AccessRequest, OperatorSession } from '../types'

// Credentials stay in the backend's HttpOnly cookies, never in browser storage.
const credentials = 'include' as const

export const operatorAuthApi = {
  configuration: () => request<{ configured: boolean }>('/auth/google/status', { credentials }),
  session: () => request<OperatorSession>('/operator/auth/session', { credentials }),
  ownRequest: () => request<AccessRequest | undefined>('/operator/access-request', { credentials }),
  apply: () => request<AccessRequest>('/operator/access-request', { method: 'POST', credentials, retry: 0 }),
  exchange: () => request<undefined>('/operator/auth/exchange', { method: 'POST', credentials, retry: 0 }),
  logout: () => request<undefined>('/operator/auth/logout', { method: 'POST', credentials, retry: 0 }),
}
