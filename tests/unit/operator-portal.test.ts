import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h } from 'vue'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { operatorAuthApi } from '~/operator/api/operator-auth'
import { useOperatorPortal } from '~/operator/composables/useOperatorPortal'
import type { OperatorSession } from '~/operator/types'
import { ApiError } from '~/lib/api/error'
import { buildGoogleStartUrl, isGoogleAuthError } from '~/lib/auth/google'

vi.mock('~/operator/api/operator-auth', () => ({
  operatorAuthApi: { configuration: vi.fn(), session: vi.fn(), logout: vi.fn() },
}))

const api = vi.mocked(operatorAuthApi)
const managerSession: OperatorSession = {
  email: 'operator@example.com', googleSub: 'google-identity', accessSource: 'MANAGER',
  expiresAt: '2026-09-28T09:00:00Z',
}
const awaitingGrant: OperatorSession = {
  ...managerSession, accessSource: 'APPLICANT', expiresAt: '2026-09-28T01:20:00Z',
}
let wrapper: VueWrapper
let portal: ReturnType<typeof useOperatorPortal>

async function start() {
  wrapper = mount(defineComponent({ setup() { portal = useOperatorPortal(); return () => h('div') } }))
  await flushPromises()
  return portal
}

beforeEach(() => {
  vi.resetAllMocks()
  api.session.mockRejectedValue(new ApiError('Authentication is required', 401))
  api.configuration.mockResolvedValue({ configured: true })
  api.logout.mockResolvedValue(undefined)
})
afterEach(() => {
  wrapper?.unmount()
  vi.restoreAllMocks()
})

describe('operator portal authentication lifecycle', () => {
  it('offers Google login only after checking configuration for an unauthenticated visitor', async () => {
    const state = await start()
    expect(state.ready.value).toBe(true)
    expect(state.session.value).toBeNull()
    expect(state.configured.value).toBe(true)
  })

  it('keeps Google login disabled when OAuth is not configured', async () => {
    api.configuration.mockResolvedValue({ configured: false })
    const state = await start()
    expect(state.ready.value).toBe(true)
    expect(state.configured.value).toBe(false)
  })

  it('shows a retryable connection error when the initial session probe returns 503', async () => {
    api.session.mockRejectedValue(new ApiError('unavailable', 503))
    const state = await start()
    expect(state.ready.value).toBe(false)
    expect(state.error.value).toContain('接続できません')
  })

  it('shows a signed-in identity while it waits for a direct administrator grant', async () => {
    api.session.mockResolvedValue(awaitingGrant)
    const state = await start()
    expect(state.session.value?.email).toBe(awaitingGrant.email)
    expect(state.isManager.value).toBe(false)
    expect(api.configuration).not.toHaveBeenCalled()
  })

  it('uses the manager session returned after a direct grant without a request exchange', async () => {
    api.session.mockResolvedValueOnce(awaitingGrant).mockResolvedValue(managerSession)
    const state = await start()
    await state.refresh()
    expect(state.isManager.value).toBe(true)
    expect(api.session).toHaveBeenCalledTimes(2)
  })

  it('revokes cookies through the backend on logout and returns to sign-in', async () => {
    api.session.mockResolvedValueOnce(managerSession)
    api.session.mockRejectedValue(new ApiError('Authentication is required', 401))
    const state = await start()
    await state.logout()
    expect(api.logout).toHaveBeenCalledOnce()
    expect(state.session.value).toBeNull()
    expect(state.notice.value).toBe('ログアウトしました。')
  })

  it('keeps the session visible when logout fails for a non-auth reason', async () => {
    api.session.mockResolvedValue(managerSession)
    api.logout.mockRejectedValue(new ApiError('unavailable', 503))
    const state = await start()
    await state.logout()
    expect(state.session.value?.email).toBe(managerSession.email)
    expect(state.error.value).toContain('接続できません')
  })

  it('ignores a second refresh while a refresh is already in progress', async () => {
    const state = await start()
    let resolve!: (session: OperatorSession) => void
    api.session.mockImplementationOnce(() => new Promise(done => { resolve = done }))
    const firstRefresh = state.refresh()
    await state.refresh()
    expect(api.session).toHaveBeenCalledTimes(2)
    resolve(managerSession)
    await firstRefresh
    expect(state.busy.value).toBe(false)
  })

  it('refreshes the session when the page is restored from browser history', async () => {
    const state = await start()
    window.dispatchEvent(new Event('pageshow'))
    await flushPromises()
    expect(api.session).toHaveBeenCalledTimes(2)
    expect(state.ready.value).toBe(true)
  })

  it('cleans up the pageshow listener when the portal is unmounted', async () => {
    await start()
    wrapper.unmount()
    window.dispatchEvent(new Event('pageshow'))
    await flushPromises()
    expect(api.session).toHaveBeenCalledOnce()
  })
})

describe('shared Google OAuth helpers', () => {
  it('builds a start URL under the configured API base without a trailing slash', () => {
    expect(buildGoogleStartUrl('/api/', 'operator')).toBe('/api/auth/operator/google/start')
    expect(buildGoogleStartUrl('/api', 'admin')).toBe('/api/auth/google/start')
  })

  it('detects only the agreed auth_error marker', () => {
    expect(isGoogleAuthError({ auth_error: 'google' })).toBe(true)
    expect(isGoogleAuthError({})).toBe(false)
  })
})
