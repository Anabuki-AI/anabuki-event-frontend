import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h } from 'vue'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { adminAuthApi } from '~/admin/api/admin-auth'
import { useAdminPortal } from '~/admin/composables/useAdminPortal'
import type { AccessRequest, AdminSession } from '~/admin/types'
import { ApiError } from '~/lib/api/error'

vi.mock('~/admin/api/admin-auth', () => ({
  adminAuthApi: {
    configuration: vi.fn(), session: vi.fn(), ownRequest: vi.fn(), apply: vi.fn(),
    exchange: vi.fn(), logout: vi.fn(), pendingRequests: vi.fn(), decide: vi.fn(),
    pendingOperatorRequests: vi.fn(), decideOperatorRequest: vi.fn(),
  },
}))

const api = vi.mocked(adminAuthApi)
const applicant: AdminSession = {
  email: 'team@example.com', googleSub: 'google-identity', accessSource: 'APPLICANT',
  permissions: [], expiresAt: '2026-09-28T01:20:00Z',
}
const manager: AdminSession = {
  ...applicant, accessSource: 'MANAGEMENT_ACCESS',
  permissions: ['MANAGEMENT_PAGE_VIEW', 'ACCESS_REQUEST_APPROVE'], expiresAt: '2026-09-28T09:00:00Z',
}
const pending: AccessRequest = {
  id: 42, email: applicant.email, status: 'PENDING', createdAt: '2026-09-28T01:00:00Z',
  expiresAt: applicant.expiresAt, cancelledAt: null, cancellationReason: null, decidedAt: null,
}
let wrapper: VueWrapper
let portal: ReturnType<typeof useAdminPortal>

async function start() {
  wrapper = mount(defineComponent({ setup() { portal = useAdminPortal(); return () => h('div') } }))
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
  api.pendingRequests.mockResolvedValue([])
  api.pendingOperatorRequests.mockResolvedValue([])
  api.apply.mockResolvedValue(pending)
  api.exchange.mockResolvedValue(undefined)
  api.logout.mockResolvedValue(undefined)
})
afterEach(() => {
  wrapper?.unmount()
  vi.useRealTimers()
  vi.restoreAllMocks()
})

describe('admin portal authentication and application lifecycle', () => {
  it('offers Google login only after checking configuration for an unauthenticated visitor', async () => {
    const state = await start()
    expect(state.ready.value).toBe(true)
    expect(state.session.value).toBeNull()
    expect(state.configured.value).toBe(true)
    expect(state.error.value).toBe('')
    expect(state.step.value).toBe(1)
  })

  it('does not offer a fake/password fallback when OAuth is unconfigured', async () => {
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

  it('handles a 204 own-request response without automatically applying', async () => {
    api.session.mockResolvedValue(applicant)
    const state = await start()
    expect(state.session.value?.email).toBe(applicant.email)
    expect(state.accessRequest.value).toBeNull()
    expect(state.step.value).toBe(2)
    expect(api.apply).not.toHaveBeenCalled()
    await state.apply()
    expect(state.accessRequest.value?.status).toBe('PENDING')
    expect(api.apply).toHaveBeenCalledOnce()
  })

  it('requires a confirmed request lookup before showing the application controls', async () => {
    api.session.mockResolvedValue(applicant)
    api.ownRequest.mockRejectedValue(new ApiError('unavailable', 503))
    const state = await start()
    expect(state.ready.value).toBe(false)
    expect(state.error.value).not.toBe('')
  })

  it('refreshes pending requests every ten seconds and waits for explicit exchange', async () => {
    api.session.mockResolvedValue(applicant)
    api.ownRequest.mockResolvedValueOnce(pending).mockResolvedValue({ ...pending, status: 'APPROVED' })
    const state = await start()
    await vi.advanceTimersByTimeAsync(10_000)
    expect(state.accessRequest.value?.status).toBe('APPROVED')
    expect(state.notice.value).toContain('承認されました')
    expect(api.exchange).not.toHaveBeenCalled()
    await vi.advanceTimersByTimeAsync(20_000)
    expect(api.ownRequest).toHaveBeenCalledTimes(2)
  })

  it('exchanges an approved applicant session, then re-reads backend permissions', async () => {
    api.session.mockResolvedValueOnce(applicant).mockResolvedValue(manager)
    api.ownRequest.mockResolvedValue({ ...pending, status: 'APPROVED' })
    const state = await start()
    await state.enter()
    expect(api.exchange).toHaveBeenCalledOnce()
    expect(state.isManager.value).toBe(true)
    expect(state.step.value).toBe(3)
    expect(state.accessRequest.value).toBeNull()
  })

  it('loads existing management and environment access without an application', async () => {
    api.session.mockResolvedValue({ ...manager, accessSource: 'ENVIRONMENT_ACCESS' })
    api.pendingRequests.mockResolvedValue([pending])
    const state = await start()
    expect(state.isManager.value).toBe(true)
    expect(state.pendingRequests.value).toHaveLength(1)
    expect(api.ownRequest).not.toHaveBeenCalled()
    expect(api.exchange).not.toHaveBeenCalled()
  })

  it('only retrieves the approval inbox when the session grants its permission', async () => {
    api.session.mockResolvedValue({ ...manager, permissions: ['MANAGEMENT_PAGE_VIEW'] })
    const state = await start()
    expect(state.canApprove.value).toBe(false)
    expect(api.pendingRequests).not.toHaveBeenCalled()
  })

  it.each(['REJECTED', 'CANCELLED'] as const)('preserves %s rather than silently retrying', async (status) => {
    api.session.mockResolvedValue(applicant)
    api.ownRequest.mockResolvedValue({ ...pending, status })
    const state = await start()
    expect(state.accessRequest.value?.status).toBe(status)
    await vi.advanceTimersByTimeAsync(20_000)
    expect(api.apply).not.toHaveBeenCalled()
    expect(api.ownRequest).toHaveBeenCalledOnce()
  })

  it('allows a deliberate reapplication after rejection', async () => {
    api.session.mockResolvedValue(applicant)
    api.ownRequest.mockResolvedValue({ ...pending, status: 'REJECTED' })
    const state = await start()
    await state.apply()
    expect(state.accessRequest.value?.status).toBe('PENDING')
  })

  it('stops background retries on a network error and supports manual recovery', async () => {
    api.session.mockResolvedValue(applicant)
    api.ownRequest.mockResolvedValueOnce(pending).mockRejectedValueOnce(new ApiError('network')).mockResolvedValue(pending)
    const state = await start()
    await vi.advanceTimersByTimeAsync(10_000)
    expect(state.error.value).not.toBe('')
    await vi.advanceTimersByTimeAsync(30_000)
    expect(api.ownRequest).toHaveBeenCalledTimes(2)
    await state.refresh()
    expect(state.error.value).toBe('')
    expect(state.accessRequest.value?.status).toBe('PENDING')
  })

  it('pauses background polling while the page is hidden and resumes when visible', async () => {
    api.session.mockResolvedValue(applicant)
    api.ownRequest.mockResolvedValue(pending)
    await start()
    vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('hidden')
    await vi.advanceTimersByTimeAsync(30_000)
    expect(api.ownRequest).toHaveBeenCalledOnce()
    vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('visible')
    document.dispatchEvent(new Event('visibilitychange'))
    await flushPromises()
    expect(api.ownRequest).toHaveBeenCalledTimes(2)
  })

  it('returns expired sessions to sign-in rather than retaining management access', async () => {
    api.session.mockResolvedValueOnce({ ...manager, expiresAt: '2026-09-28T01:00:10Z' })
    const state = await start()
    expect(state.isManager.value).toBe(true)
    await vi.advanceTimersByTimeAsync(10_000)
    expect(state.session.value).toBeNull()
    expect(state.pendingRequests.value).toEqual([])
    expect(state.notice.value).toContain('有効期限')
  })

  it('handles a 401 during application with a fresh Google login prompt', async () => {
    api.session.mockResolvedValueOnce(applicant)
    api.apply.mockRejectedValue(new ApiError('expired', 401))
    const state = await start()
    await state.apply()
    expect(state.session.value).toBeNull()
    expect(state.configured.value).toBe(true)
    expect(state.notice.value).toContain('有効期限')
  })

  it('never upgrades permissions locally when exchange is forbidden', async () => {
    api.session.mockResolvedValue(applicant)
    api.ownRequest.mockResolvedValue({ ...pending, status: 'APPROVED' })
    api.exchange.mockRejectedValue(new ApiError('forbidden', 403))
    const state = await start()
    await state.enter()
    expect(state.isManager.value).toBe(false)
    expect(state.ready.value).toBe(false)
    expect(state.error.value).toContain('権限')
  })

  it('prevents duplicate mutation requests while a submission is in flight', async () => {
    api.session.mockResolvedValue(applicant)
    let resolve!: (value: AccessRequest) => void
    api.apply.mockImplementation(() => new Promise(done => { resolve = done }))
    const state = await start()
    const first = state.apply()
    await state.apply()
    expect(api.apply).toHaveBeenCalledOnce()
    expect(state.busy.value).toBe(true)
    resolve(pending)
    await first
    expect(state.busy.value).toBe(false)
  })

  it('revokes cookies through the backend on logout and clears all identity data', async () => {
    api.session.mockResolvedValueOnce(manager)
    api.pendingRequests.mockResolvedValue([pending])
    const state = await start()
    await state.logout()
    expect(api.logout).toHaveBeenCalledOnce()
    expect(state.session.value).toBeNull()
    expect(state.pendingRequests.value).toEqual([])
    expect(state.notice.value).toBe('ログアウトしました。')
  })

  it('removes a decided request only after the backend accepts it', async () => {
    api.session.mockResolvedValue(manager)
    api.pendingRequests.mockResolvedValue([pending])
    api.decide.mockResolvedValue({ ...pending, status: 'APPROVED' })
    const state = await start()
    await state.decide(42, 'approve')
    expect(api.decide).toHaveBeenCalledWith(42, 'approve')
    expect(state.pendingRequests.value).toEqual([])
  })

  it('keeps stale requests visible with a recovery action when decision conflicts', async () => {
    api.session.mockResolvedValue(manager)
    api.pendingRequests.mockResolvedValue([pending])
    api.decide.mockRejectedValue(new ApiError('no longer pending', 409))
    const state = await start()
    await state.decide(42, 'approve')
    expect(state.pendingRequests.value).toHaveLength(1)
    expect(state.error.value).toContain('状態が変更')
  })

  it('loads and decides operator access requests separately from team requests', async () => {
    api.session.mockResolvedValue(manager)
    api.pendingOperatorRequests.mockResolvedValue([pending])
    api.decideOperatorRequest.mockResolvedValue({ ...pending, status: 'APPROVED' })
    const state = await start()
    expect(state.pendingOperatorRequests.value).toEqual([pending])
    await state.decideOperatorRequest(42, 'approve')
    expect(api.decideOperatorRequest).toHaveBeenCalledWith(42, 'approve')
    expect(api.decide).not.toHaveBeenCalled()
    expect(state.pendingOperatorRequests.value).toEqual([])
  })

  it('skips the operator approval inbox without the approval permission', async () => {
    api.session.mockResolvedValue({ ...manager, permissions: ['MANAGEMENT_PAGE_VIEW'] })
    const state = await start()
    expect(api.pendingOperatorRequests).not.toHaveBeenCalled()
    expect(state.pendingOperatorRequests.value).toEqual([])
  })

  it('cleans up polling and listeners when the portal is unmounted', async () => {
    api.session.mockResolvedValue(applicant)
    api.ownRequest.mockResolvedValue(pending)
    await start()
    wrapper.unmount()
    await vi.advanceTimersByTimeAsync(30_000)
    document.dispatchEvent(new Event('visibilitychange'))
    expect(api.ownRequest).toHaveBeenCalledOnce()
  })

  it('restores the sign-in control when navigating back from Google', async () => {
    const state = await start()
    state.departing.value = true
    window.dispatchEvent(new Event('pageshow'))
    await flushPromises()
    expect(state.departing.value).toBe(false)
    expect(api.session).toHaveBeenCalledTimes(2)
  })
})
