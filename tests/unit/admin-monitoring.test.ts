import { afterEach, describe, expect, it } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import MonitoringPanel from '~/admin/components/MonitoringPanel.vue'
import { isMonitoringStale, parseMonitoringSnapshot, unconfiguredMonitoring, type MonitoringSource } from '~/admin/monitoring-contract'
import { accessSourceLabel, consolePages, formatConsoleDate, getConsolePage } from '~/admin/console-presentation'

let wrapper: VueWrapper
function render(overrides: Partial<MonitoringSource> = {}) {
  const snapshot = unconfiguredMonitoring()
  Object.assign(snapshot.sources[0]!, overrides)
  wrapper = mount(MonitoringPanel, { props: { snapshot, enabled: true, loading: false, error: '' } })
  return wrapper
}
afterEach(() => wrapper?.unmount())

describe('admin console navigation and presentation', () => {
  it('matches the requested five authenticated screens', () => {
    expect(consolePages.map(page => page.path)).toEqual(['/admin', '/admin/logs', '/admin/status', '/admin/permissions', '/admin/logout'])
    expect(getConsolePage('/admin/status/').key).toBe('status')
    expect(getConsolePage('/admin/login').key).toBe('home')
  })
  it('formats Japan time explicitly and tolerates invalid data', () => {
    expect(formatConsoleDate('2026-09-28T01:00:00Z')).toContain('10:00:00')
    expect(formatConsoleDate('invalid')).toBe('日時を取得できません')
    expect(accessSourceLabel('ENVIRONMENT_ACCESS')).toBe('環境設定による付与')
    expect(accessSourceLabel('MANAGEMENT_ACCESS')).toBe('管理者による直接付与')
  })
})

describe('external monitoring contract and honest state presentation', () => {
  it('validates a complete unconfigured snapshot without inventing numbers', () => {
    const snapshot = parseMonitoringSnapshot(unconfiguredMonitoring())
    expect(snapshot.sources).toHaveLength(2)
    expect(snapshot.sources[0]?.metrics.errorRatePercent).toBeNull()
  })
  it.each([
    {}, { sources: [] }, { sources: [unconfiguredMonitoring().sources[0], unconfiguredMonitoring().sources[0]] },
  ])('rejects absent or duplicate sources: %j', (value) => {
    expect(() => parseMonitoringSnapshot(value)).toThrow()
  })
  it('requires timestamps for ready sources and an aggregation window for metrics', () => {
    const snapshot = unconfiguredMonitoring()
    snapshot.sources[0]!.state = 'ready'
    expect(() => parseMonitoringSnapshot(snapshot)).toThrow()
    snapshot.sources[0]!.fetchedAt = new Date().toISOString()
    snapshot.sources[0]!.updatedAt = new Date().toISOString()
    expect(() => parseMonitoringSnapshot(snapshot)).not.toThrow()
    snapshot.sources[0]!.metrics.errorRatePercent = 0
    expect(() => parseMonitoringSnapshot(snapshot)).toThrow()
    snapshot.sources[0]!.metrics.windowLabel = '直近15分'
    expect(() => parseMonitoringSnapshot(snapshot)).not.toThrow()
    snapshot.sources[0]!.metrics.errorRatePercent = 101
    expect(() => parseMonitoringSnapshot(snapshot)).toThrow()
  })
  it('shows missing metrics as missing, not zero, in the unconfigured state', () => {
    const view = render()
    expect(view.text()).toContain('未設定・未連携')
    expect(view.findAll('.metric-pair dd').map(node => node.text())).toEqual(['未取得', '未取得', '未取得', '未取得'])
    expect(view.text()).not.toContain('正常稼働')
  })
  it.each([
    ['unauthenticated', '連携先の認証が必要'], ['forbidden', '連携先への権限不足'], ['error', '取得失敗'],
  ] as const)('renders %s separately from an outage', (state, label) => {
    const view = render({ state })
    expect(view.text()).toContain(label)
    expect(view.text()).not.toContain('正常稼働')
  })
  it('shows partial outages from one provider while another is unconfigured', () => {
    const now = new Date().toISOString()
    const view = render({ state: 'ready', condition: 'partial_outage', fetchedAt: now, updatedAt: now })
    expect(view.text()).toContain('部分障害')
    expect(view.text()).toContain('未設定・未連携')
    expect(view.findAll('.badge.warning')).toHaveLength(1)
  })
  it('labels stale successes as historical, not current green status', () => {
    const old = '2020-01-01T00:00:00Z'
    const view = render({ state: 'ready', condition: 'operational', fetchedAt: old, updatedAt: old })
    expect(view.text()).toContain('過去の観測：正常稼働')
    expect(view.findAll('.badge.positive')).toHaveLength(0)
    expect(isMonitoringStale({ ...unconfiguredMonitoring().sources[0]!, fetchedAt: old })).toBe(true)
  })
  it('retains real zero metrics, with provenance, when supplied by a ready source', () => {
    const now = new Date().toISOString()
    const view = render({ state: 'ready', condition: 'operational', fetchedAt: now, updatedAt: now, metrics: { errorRatePercent: 0, responseTimeMs: 120, windowLabel: '直近15分' } })
    expect(view.findAll('.metric-pair dd')[0]?.text()).toBe('0%')
    expect(view.text()).toContain('集計：直近15分')
  })
  it('replaces provider results with fetch errors or loading rather than stale success', async () => {
    const view = render()
    await view.setProps({ error: '取得失敗' })
    expect(view.find('[role="alert"]').text()).toBe('取得失敗')
    expect(view.findAll('.provider-card')).toHaveLength(0)
    await view.setProps({ loading: true })
    expect(view.find('[role="status"]').text()).toContain('取得しています')
    expect(view.find('button').attributes('disabled')).toBeDefined()
  })
})
