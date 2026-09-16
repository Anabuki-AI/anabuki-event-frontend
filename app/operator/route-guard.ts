import { adminAuthApi } from '~/admin/api/admin-auth'
import { operatorAuthApi } from './api/operator-auth'
import type { AdminSession } from '~/admin/types'
import type { OperatorSession } from './types'

export type OperatorSessionLoader = () => Promise<OperatorSession>
export type AdminSessionLoader = () => Promise<AdminSession>

export function isEventOperatorPath(path: string) {
  return path === '/event_operator' || path.startsWith('/event_operator/')
}

export async function eventOperatorRedirect(
  path: string,
  loadOperatorSession: OperatorSessionLoader = operatorAuthApi.session,
  loadAdminSession: AdminSessionLoader = adminAuthApi.session,
): Promise<string | null> {
  if (!isEventOperatorPath(path)) return null

  try {
    const operator = await loadOperatorSession()
    if (operator.accessSource === 'MANAGER') return null
  }
  catch {
    // An administrator session may still authorize the operations workspace.
  }

  try {
    const admin = await loadAdminSession()
    if (admin.permissions.includes('MANAGEMENT_PAGE_VIEW')) return null
  }
  catch {
    // The operator portal owns detailed authentication and connectivity feedback.
  }

  return '/operator/login'
}
