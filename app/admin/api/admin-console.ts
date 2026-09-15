import { request } from '~/lib/api/client'

export interface ManagementAccount {
  id: string | null
  email: string
  source: 'ENVIRONMENT_ACCESS' | 'MANAGEMENT_ACCESS'
  active: boolean
}

export const adminConsoleApi = {
  monitoring: () => request<unknown>('/admin/monitoring', { credentials: 'include', retry: 0, timeout: 10000 }),
  accounts: () => request<ManagementAccount[]>('/admin/allowed-emails', { credentials: 'include', retry: 0 }),
  // This fixed Nuxt route forwards only the Rails public /health endpoint.
  health: () => request<{ status: string }>('/admin/service-health', { credentials: 'omit', retry: 0, timeout: 8000 }),
}
