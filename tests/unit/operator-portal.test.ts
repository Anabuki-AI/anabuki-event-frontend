import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h } from 'vue'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { operatorAuthApi } from '~/operator/api/operator-auth'
import { useOperatorPortal } from '~/operator/composables/useOperatorPortal'
import type { OperatorSession } from '~/operator/types'
import { ApiError } from '~/lib/api/error'
import { buildGoogleStartUrl, isGoogleAuthError } from '~/lib/auth/google'

vi.mock('~/operator/api/operator-auth', () => ({
  operatorAuthApi: {
    configuration: vi.fn(), session: vi.fn(), logout: vi.fn(),
  },
}))

const api = vi.mocked(operatorAuthApi)
const session: OperatorSession = {
  email: 'operator@example.com', googleSub: 'google-identity',
  expiresAt: '2026-09-28T09:00:00Z',
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
    expect(state.error.value).toBe('')
  })

  it('reports unconfigured OAuth rather than offering a fake login', async () => {
    api.configuration.mockResolvedValue({ configured: false })
    const state = await start()
    expect(state.ready.value).toBe(true)
    expect(state.configured.value).toBe(false)
  })

  it('does not mistake a backend outage for a signed-out session', async () => {
    api.session.mockRejectedValue(new ApiError('unavailable', 503))
    const state = await start()
    expect(state.ready.value).toBe(false)
    expect(state.error.value).toContain('接続できません')
    expect(api.configuration).not.toHaveBeenCalled()
  })

  it('loads an existing operator session without extra requests', async () => {
    api.session.mockResolvedValue(session)
    const state = await start()
    expect(state.ready.value).toBe(true)
    expect(state.session.value?.email).toBe(session.email)
    expect(api.configuration).not.toHaveBeenCalled()
  })

  it('revokes cookies through the backend on logout and returns to sign-in', async () => {
    api.session.mockResolvedValueOnce(session)
    api.session.mockRejectedValue(new ApiError('Authentication is required', 401))
    const state = await start()
    await state.logout()
    expect(api.logout).toHaveBeenCalledOnce()
    expect(state.session.value).toBeNull()
    expect(state.notice.value).toBe('ログアウトしました。')
    expect(state.ready.value).toBe(true)
    expect(state.configured.value).toBe(true)
  })

  it('handles a 401 during logout with a fresh Google login prompt', async () => {
    api.session.mockResolvedValueOnce(session)
    api.logout.mockRejectedValue(new ApiError('expired', 401))
    const state = await start()
    await state.logout()
    expect(state.session.value).toBeNull()
    expect(state.notice.value).toContain('有効期限')
    expect(state.configured.value).toBe(true)
  })

  it('keeps the session visible when logout fails for a non-auth reason', async () => {
    api.session.mockResolvedValue(session)
    api.logout.mockRejectedValue(new ApiError('unavailable', 503))
    const state = await start()
    await state.logout()
    expect(state.session.value?.email).toBe(session.email)
    expect(state.error.value).toContain('接続できません')
  })

  it('prevents duplicate requests while one is in flight', async () => {
    api.session.mockResolvedValue(session)
    let resolve!: () => void
    api.logout.mockImplementation(() => new Promise<void>(done => { resolve = done }))
    const state = await start()
    const first = state.logout()
    await state.logout()
    expect(api.logout).toHaveBeenCalledOnce()
    expect(state.busy.value).toBe(true)
    resolve()
    await first
    expect(state.busy.value).toBe(false)
  })

  it('restores the sign-in control when navigating back from Google', async () => {
    const state = await start()
    state.departing.value = true
    window.dispatchEvent(new Event('pageshow'))
    await flushPromises()
    expect(state.departing.value).toBe(false)
    expect(api.session).toHaveBeenCalledTimes(2)
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
    expect(isGoogleAuthError(undefined)).toBe(false)
  })
})
