import { request } from '~/lib/api/client'
import { eventOperatorRedirect } from '~/operator/route-guard'
import type { OperatorSession } from '~/operator/types'

export default defineNuxtRouteMiddleware(async (to) => {
  const cookie = import.meta.server ? useRequestHeader('cookie') : undefined
  const loadSession = import.meta.server
    ? () => request<OperatorSession>('/operator/auth/session', {
        credentials: 'include',
        headers: cookie ? { cookie } : undefined,
      })
    : undefined

  const redirect = await eventOperatorRedirect(to.path, loadSession)
  if (redirect) return navigateTo(redirect)
})
