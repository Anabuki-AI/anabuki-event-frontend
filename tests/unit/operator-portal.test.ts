import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h } from 'vue'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { operatorAuthApi } from '~/operator/api/operator-auth'
import { useOperatorPortal } from '~/operator/composables/useOperatorPortal'
import type { AccessRequest, OperatorSession } from '~/operator/types'
import { ApiError } from '~/lib/api/error'
import { buildGoogleStartUrl, isGoogleAuthError } from '~/lib/auth/google'

vi.mock('~/operator/api/operator-auth', () => ({
  operatorAuthApi: {
    configuration: vi.fn(), session: vi.fn(), ownRequest: vi.fn(),
    apply: vi.fn(), exchange: vi.fn(), logout: vi.fn(),
  },
}))

const api = vi.mocked(operatorAuthApi)
const managerSession: OperatorSession = {
  email: 'operator@example.com', googleSub: 'google-identity', accessSource: 'MANAGER',
  expiresAt: '2026-09-28T09:00:00Z',
}
const applicantSession: OperatorSession = {
  ...managerSession, accessSource: 'APPLICANT', expiresAt: '2026-09-28T01:20:00Z',
}
const pendingRequest: AccessRequest = {
  id: 7, email: applicantSession.email, status: 'PENDING', createdAt: '2026-09-28T01:00:00Z',
  expiresAt: applicantSession.expiresAt, cancelledAt: null, cancellationReason: null, decidedAt: null,
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
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2026-09-28T01:00:00Z'))
  vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('visible')
  api.session.mockRejectedValue(new ApiError('Authentication is required', 401))
  api.configuration.mockResolvedValue({ configured: true })
  api.ownRequest.mockResolvedValue(undefined)
  api.apply.mockResolvedValue(pendingRequest)
  api.exchange.mockResolvedValue(undefined)
  api.logout.mockResolvedValue(undefined)
})
afterEach(() => {
  wrapper?.unmount()
  vi.useRealTimers()
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
    api.session.mockResolvedValue(managerSession)
    const state = await start()
    expect(state.ready.value).toBe(true)
    expect(state.session.value?.email).toBe(managerSession.email)
    expect(state.isManager.value).toBe(true)
    expect(api.configuration).not.toHaveBeenCalled()
    expect(api.ownRequest).not.toHaveBeenCalled()
  })

  it('revokes cookies through the backend on logout and returns to sign-in', async () => {
    api.session.mockResolvedValueOnce(managerSession)
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
    api.session.mockResolvedValueOnce(managerSession)
    api.logout.mockRejectedValue(new ApiError('expired', 401))
    const state = await start()
    await state.logout()
    expect(state.session.value).toBeNull()
    expect(state.notice.value).toContain('有効期限')
    expect(state.configured.value).toBe(true)
  })

  it('keeps the session visible when logout fails for a non-auth reason', async () => {
    api.session.mockResolvedValue(managerSession)
    api.logout.mockRejectedValue(new ApiError('unavailable', 503))
    const state = await start()
    await state.logout()
    expect(state.session.value?.email).toBe(managerSession.email)
    expect(state.error.value).toContain('接続できません')
  })

  it('prevents duplicate requests while one is in flight', async () => {
    api.session.mockResolvedValue(managerSession)
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

describe('operator access-request flow', () => {
  it('shows an applicant without a request and submits one only on demand', async () => {
    api.session.mockResolvedValue(applicantSession)
    const state = await start()
    expect(state.isManager.value).toBe(false)
    expect(state.accessRequest.value).toBeNull()
    expect(api.apply).not.toHaveBeenCalled()
    await state.apply()
    expect(api.apply).toHaveBeenCalledOnce()
    expect(state.accessRequest.value?.status).toBe('PENDING')
    expect(state.notice.value).toContain('送信')
  })

  it('preserves a rejected request while allowing a deliberate reapplication', async () => {
    api.session.mockResolvedValue(applicantSession)
    api.ownRequest.mockResolvedValue({ ...pendingRequest, status: 'REJECTED' })
    const state = await start()
    expect(state.accessRequest.value?.status).toBe('REJECTED')
    await state.apply()
    expect(state.accessRequest.value?.status).toBe('PENDING')
  })

  it('polls pending requests every ten seconds and announces an approval', async () => {
    api.session.mockResolvedValue(applicantSession)
    api.ownRequest.mockResolvedValueOnce(pendingRequest).mockResolvedValue({ ...pendingRequest, status: 'APPROVED' })
    const state = await start()
    await vi.advanceTimersByTimeAsync(10_000)
    expect(state.accessRequest.value?.status).toBe('APPROVED')
    expect(state.notice.value).toContain('承認されました')
    // Waiting for the operator to press the button: no automatic exchange.
    expect(api.exchange).not.toHaveBeenCalled()
    await vi.advanceTimersByTimeAsync(20_000)
    expect(api.ownRequest).toHaveBeenCalledTimes(2)
  })

  it('exchanges an approved applicant session, then re-reads backend access', async () => {
    api.session.mockResolvedValueOnce(applicantSession).mockResolvedValue(managerSession)
    api.ownRequest.mockResolvedValue({ ...pendingRequest, status: 'APPROVED' })
    const state = await start()
    await state.enter()
    expect(api.exchange).toHaveBeenCalledOnce()
    expect(state.isManager.value).toBe(true)
    expect(state.accessRequest.value).toBeNull()
  })

  it('stops background polling while the page is hidden and resumes when visible', async () => {
    api.session.mockResolvedValue(applicantSession)
    api.ownRequest.mockResolvedValue(pendingRequest)
    await start()
    vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('hidden')
    await vi.advanceTimersByTimeAsync(30_000)
    expect(api.ownRequest).toHaveBeenCalledOnce()
    vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('visible')
    document.dispatchEvent(new Event('visibilitychange'))
    await flushPromises()
    expect(api.ownRequest).toHaveBeenCalledTimes(2)
  })

  it('stops background retries on a network error and supports manual recovery', async () => {
    api.session.mockResolvedValue(applicantSession)
    api.ownRequest.mockResolvedValueOnce(pendingRequest).mockRejectedValueOnce(new ApiError('network')).mockResolvedValue(pendingRequest)
    const state = await start()
    await vi.advanceTimersByTimeAsync(10_000)
    expect(state.error.value).not.toBe('')
    await vi.advanceTimersByTimeAsync(30_000)
    expect(api.ownRequest).toHaveBeenCalledTimes(2)
    await state.refresh()
    expect(state.error.value).toBe('')
    expect(state.accessRequest.value?.status).toBe('PENDING')
  })

  it('cleans up polling and listeners when the portal is unmounted', async () => {
    api.session.mockResolvedValue(applicantSession)
    api.ownRequest.mockResolvedValue(pendingRequest)
    await start()
    wrapper.unmount()
    await vi.advanceTimersByTimeAsync(30_000)
    document.dispatchEvent(new Event('visibilitychange'))
    expect(api.ownRequest).toHaveBeenCalledOnce()
  })

  it('announces a rejection or cancellation detected by polling once', async () => {
    api.session.mockResolvedValue(applicantSession)
    api.ownRequest.mockResolvedValueOnce(pendingRequest).mockResolvedValue({ ...pendingRequest, status: 'CANCELLED' })
    const state = await start()
    await vi.advanceTimersByTimeAsync(10_000)
    expect(state.notice.value).toContain('取り消されました')
    await vi.advanceTimersByTimeAsync(20_000)
    expect(state.notice.value).toContain('取り消されました')
  })

  it('returns expired applicant sessions to sign-in on the next action', async () => {
    api.session.mockResolvedValueOnce(applicantSession)
    api.ownRequest.mockResolvedValue(pendingRequest)
    api.apply.mockRejectedValue(new ApiError('expired', 401))
    const state = await start()
    await state.apply()
    expect(state.session.value).toBeNull()
    expect(state.accessRequest.value).toBeNull()
    expect(state.notice.value).toContain('有効期限')
    expect(state.configured.value).toBe(true)
  })

  it('never upgrades access locally when exchange is forbidden', async () => {
    api.session.mockResolvedValue(applicantSession)
    api.ownRequest.mockResolvedValue({ ...pendingRequest, status: 'APPROVED' })
    api.exchange.mockRejectedValue(new ApiError('forbidden', 403))
    const state = await start()
    await state.enter()
    expect(state.isManager.value).toBe(false)
    expect(state.error.value).toContain('権限')
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
