import { operatorAuthApi } from './api/operator-auth'
import type { OperatorSession } from './types'

export type OperatorSessionLoader = () => Promise<OperatorSession>

export function isEventOperatorPath(path: string) {
  return path === '/event_operator' || path.startsWith('/event_operator/')
}

export async function eventOperatorRedirect(
  path: string,
  loadSession: OperatorSessionLoader = operatorAuthApi.session,
): Promise<string | null> {
  if (!isEventOperatorPath(path)) return null

  try {
    const session = await loadSession()
    return session.accessSource === 'MANAGER' ? null : '/operator'
  }
  catch {
    // Event-operation routes fail closed. The login portal owns detailed
    // authentication and connectivity feedback.
    return '/operator/login'
  }
}
