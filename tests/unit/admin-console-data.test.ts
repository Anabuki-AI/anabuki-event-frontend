import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h } from 'vue'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { adminConsoleApi } from '~/admin/api/admin-console'
import { useAdminConsoleData } from '~/admin/composables/useAdminConsoleData'
import type { MonitoringSnapshotWire } from '~/admin/monitoring-contract'
import { ApiError } from '~/lib/api/error'

vi.mock('~/admin/api/admin-console', () => ({ adminConsoleApi: { accounts: vi.fn(), operatorAccounts: vi.fn(), setOperatorAccess: vi.fn(), health: vi.fn(), monitoring: vi.fn() } }))
const apiStatusFixture: MonitoringSnapshotWire = {
  generatedAt: '2026-09-28T01:00:00Z', cached: false,
  providers: [
    { provider: 'statuspage', source: 'Statuspage', state: 'available', fetchedAt: '2026-09-28T01:00:00Z', availability: { state: 'available', value: 'operational' }, metrics: { errorRate: { state: 'not_provided', value: null, unit: 'percent' }, responseTime: { state: 'not_provided', value: null, unit: 'milliseconds' } } },
    { provider: 'datadog', source: 'Datadog', state: 'available', fetchedAt: '2026-09-28T01:00:00Z', availability: { state: 'not_provided', value: null }, metrics: { errorRate: { state: 'available', value: 0, unit: 'percent' }, responseTime: { state: 'available', value: 15, unit: 'milliseconds' } } },
  ],
}
const api = vi.mocked(adminConsoleApi)
let wrapper: VueWrapper
let data: ReturnType<typeof useAdminConsoleData>
const refreshSession = vi.fn<() => Promise<void>>()
function start(enabled = false) {
  wrapper = mount(defineComponent({ setup() { data = useAdminConsoleData(refreshSession, enabled); return () => h('div') } }))
  return data
}
beforeEach(() => { vi.resetAllMocks(); refreshSession.mockResolvedValue(undefined) })
afterEach(() => { wrapper?.unmount() })

describe('admin console resource boundaries', () => {
  it('does not query non-existent monitoring integration or invent observations', async () => {
    const state = start()
    await state.loadMonitoring()
    expect(api.monitoring).not.toHaveBeenCalled()
    expect(api.health).not.toHaveBeenCalled()
    expect(state.health.value).toBeNull()
    expect(state.accountsLoaded.value).toBe(false)
    expect(state.monitoring.value.providers.every(provider => provider.state === 'unconfigured')).toBe(true)
  })

  it('loads real account access flags without inventing roles', async () => {
    api.accounts.mockResolvedValue([{ id: null, email: 'team@example.test', source: 'ENVIRONMENT_ACCESS', active: true }])
    const state = start()
    await state.loadAccounts()
    expect(state.accountsLoaded.value).toBe(true)
    expect(state.accounts.value[0]).not.toHaveProperty('role')
  })

  it('loads Google-authenticated operator identities separately and updates direct access', async () => {
    const operator = { id: 'f6e2e2a2-438e-4bbb-b3d3-c6184fcdb1af', email: 'operator@example.test', source: 'MANAGEMENT_ACCESS' as const, active: false, managerEnabled: false }
    api.operatorAccounts.mockResolvedValue([operator])
    api.setOperatorAccess.mockResolvedValue({ ...operator, active: true, managerEnabled: true })
    const state = start()
    await state.loadOperatorAccounts()
    await state.setOperatorAccess(operator.id, true)
    expect(state.operatorAccounts.value).toEqual([{ ...operator, active: true, managerEnabled: true }])
    expect(api.setOperatorAccess).toHaveBeenCalledWith(operator.id, true)
  })

  it('distinguishes an empty successful account list from an unavailable list', async () => {
    api.accounts.mockResolvedValueOnce([]).mockRejectedValueOnce(new ApiError('outage', 503))
    const state = start()
    await state.loadAccounts()
    expect(state.accountsLoaded.value).toBe(true)
    await state.loadAccounts()
    expect(state.accountsLoaded.value).toBe(false)
    expect(state.accountsError.value).toContain('取得できません')
  })

  it.each([401, 403])('clears user data and rechecks the session after account API %s', async (code) => {
    api.accounts.mockResolvedValueOnce([{ id: null, email: 'team@example.test', source: 'ENVIRONMENT_ACCESS', active: true }]).mockRejectedValueOnce(new ApiError('access lost', code))
    const state = start()
    await state.loadAccounts()
    await state.loadAccounts()
    expect(state.accounts.value).toEqual([])
    expect(state.accountsError.value).toContain('権限')
    expect(refreshSession).toHaveBeenCalledOnce()
  })

  it('prevents duplicate account loads', async () => {
    let resolve!: (value: []) => void
    api.accounts.mockImplementation(() => new Promise(done => { resolve = done }))
    const state = start()
    const first = state.loadAccounts()
    await state.loadAccounts()
    expect(api.accounts).toHaveBeenCalledOnce()
    expect(state.accountsLoading.value).toBe(true)
    resolve([])
    await first
    expect(state.accountsLoading.value).toBe(false)
  })

  it('only reports a local successful health observation after a real ok response', async () => {
    api.health.mockResolvedValue({ status: 'ok' })
    const state = start()
    await state.checkHealth()
    expect(state.health.value?.available).toBe(true)
    expect(state.health.value?.elapsedMs).toBeGreaterThanOrEqual(0)
    expect(state.health.value?.checkedAt).toBeTruthy()
  })

  it('does not treat an unknown response as healthy', async () => {
    api.health.mockResolvedValue({ status: 'unknown' })
    const state = start()
    await state.checkHealth()
    expect(state.health.value?.available).toBe(false)
  })

  it('removes previous success on a failed probe without claiming a global outage', async () => {
    api.health.mockResolvedValueOnce({ status: 'ok' }).mockRejectedValueOnce(new ApiError('network'))
    const state = start()
    await state.checkHealth()
    await state.checkHealth()
    expect(state.health.value).toBeNull()
    expect(state.healthError.value).toContain('確認できません')
    expect(refreshSession).not.toHaveBeenCalled()
  })

  it('loads the monitoring contract only when enabled', async () => {
    api.monitoring.mockResolvedValue(apiStatusFixture)
    const state = start(true)
    await state.loadMonitoring()
    expect(api.monitoring).toHaveBeenCalledOnce()
    expect(state.monitoring.value.providers[1]?.metrics.errorRate.value).toBe(0)
    expect(state.monitoringError.value).toBe('')
  })

  it('rejects incompatible monitoring payloads instead of showing healthy defaults', async () => {
    api.monitoring.mockResolvedValue({ status: 'ok' })
    const state = start(true)
    await state.loadMonitoring()
    expect(state.monitoringError.value).toContain('判断できません')
  })

  it.each([401, 403, 503])('distinguishes monitoring API access and fetch failures (%s)', async (code) => {
    api.monitoring.mockRejectedValue(new ApiError('failed', code))
    const state = start(true)
    await state.loadMonitoring()
    expect(state.monitoringError.value).toContain(code === 401 ? '再ログイン' : code === 403 ? '権限' : '取得できません')
    expect(refreshSession).toHaveBeenCalledTimes(code === 401 ? 1 : 0)
    expect(state.monitoring.value.providers.every(provider => provider.state === 'unconfigured')).toBe(true)
  })

  it('treats a timeout as a fetch failure without rechecking a valid session', async () => {
    api.monitoring.mockRejectedValue(new Error('timeout'))
    const state = start(true)
    await state.loadMonitoring()
    expect(state.monitoringError.value).toContain('取得できません')
    expect(refreshSession).not.toHaveBeenCalled()
  })

  it('does not restore monitoring data after unmount', async () => {
    let resolve!: (value: MonitoringSnapshotWire) => void
    api.monitoring.mockImplementation(() => new Promise(done => { resolve = done }))
    const state = start(true)
    void state.loadMonitoring()
    wrapper.unmount()
    resolve(apiStatusFixture)
    await flushPromises()
    expect(state.monitoring.value.providers.every(provider => provider.state === 'unconfigured')).toBe(true)
  })

  it('does not restore data after unmount (including logout)', async () => {
    let resolve!: (value: { status: string }) => void
    api.health.mockImplementation(() => new Promise(done => { resolve = done }))
    const state = start()
    void state.checkHealth()
    wrapper.unmount()
    resolve({ status: 'ok' })
    await flushPromises()
    expect(state.health.value).toBeNull()
  })
})
