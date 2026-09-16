import { request } from '~/lib/api/client'
import { eventOperatorRedirect } from '~/operator/route-guard'
import type { AdminSession } from '~/admin/types'
import type { OperatorSession } from '~/operator/types'

export default defineNuxtRouteMiddleware(async (to) => {
  const cookie = import.meta.server ? useRequestHeader('cookie') : undefined
  const requestOptions = {
    credentials: 'include' as const,
    headers: cookie ? { cookie } : undefined,
  }
  const loadOperatorSession = import.meta.server
    ? () => request<OperatorSession>('/operator/auth/session', requestOptions)
    : undefined
  const loadAdminSession = import.meta.server
    ? () => request<AdminSession>('/admin/auth/session', requestOptions)
    : undefined

  const redirect = await eventOperatorRedirect(to.path, loadOperatorSession, loadAdminSession)
  if (redirect) return navigateTo(redirect)
})
