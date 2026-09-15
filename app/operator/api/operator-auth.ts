import { request } from '~/lib/api/client'
import type { OperatorSession } from '../types'

export type { OperatorSession } from '../types'

// Credentials stay in the backend's HttpOnly cookies, never in browser storage.
const credentials = 'include' as const

export const operatorAuthApi = {
  configuration: () => request<{ configured: boolean }>('/auth/google/status', { credentials }),
  session: () => request<OperatorSession>('/operator/auth/session', { credentials }),
  logout: () => request<undefined>('/operator/auth/logout', { method: 'POST', credentials, retry: 0 }),
}
