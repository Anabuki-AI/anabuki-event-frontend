import { afterEach, describe, expect, it } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import MonitoringPanel from '~/admin/components/MonitoringPanel.vue'
import {
  isMetricStale,
  isProviderStale,
  parseMonitoringSnapshot,
  toMonitoringView,
  unconfiguredMonitoring,
  type MonitoringSnapshotWire,
} from '~/admin/monitoring-contract'
import { accessSourceLabel, consolePages, formatConsoleDate, getConsolePage } from '~/admin/console-presentation'

let wrapper: VueWrapper
const timestamp = '2026-09-28T01:00:00Z'
function backendSnapshot(): MonitoringSnapshotWire {
  return {
    generatedAt: timestamp,
    cached: false,
    providers: [
      {
        provider: 'statuspage', source: 'Statuspage', state: 'available', fetchedAt: timestamp,
        availability: { state: 'available', value: 'operational', externalStatus: 'All Systems Operational' },
        metrics: {
          errorRate: { state: 'not_provided', value: null, unit: 'percent' },
          responseTime: { state: 'not_provided', value: null, unit: 'milliseconds' },
        },
      },
      {
        provider: 'datadog', source: 'Datadog', state: 'available', fetchedAt: timestamp,
        availability: { state: 'not_provided', value: null },
        metrics: {
          errorRate: { state: 'available', value: 0, unit: 'percent', observedAt: timestamp, fetchedAt: timestamp },
          responseTime: { state: 'available', value: 120, unit: 'milliseconds', observedAt: timestamp, fetchedAt: timestamp },
        },
      },
    ],
  }
}
function render(snapshot = toMonitoringView(backendSnapshot())) {
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

describe('backend api-status contract and honest presentation', () => {
  it('parses the backend fixture and keeps cached metadata and a zero metric', () => {
    const snapshot = parseMonitoringSnapshot({ ...backendSnapshot(), cached: true })
    expect(snapshot.cached).toBe(true)
    expect(snapshot.providers[1]?.metrics.errorRate.value).toBe(0)
  })
  it('rejects malformed schemas, duplicate providers, invalid states, and null available values', () => {
    const duplicate = backendSnapshot()
    duplicate.providers[1]!.provider = 'statuspage'
    const invalidState = backendSnapshot()
    invalidState.providers[0]!.state = 'ready' as never
    const absentValue = backendSnapshot()
    absentValue.providers[1]!.metrics.errorRate.value = null
    expect(() => parseMonitoringSnapshot({})).toThrow()
    expect(() => parseMonitoringSnapshot(duplicate)).toThrow()
    expect(() => parseMonitoringSnapshot(invalidState)).toThrow()
    expect(() => parseMonitoringSnapshot(absentValue)).toThrow()
  })
  it('keeps all documented metric states distinct', () => {
    const snapshot = backendSnapshot()
    snapshot.providers[1]!.state = 'partial'
    snapshot.providers[1]!.metrics.responseTime = { state: 'unavailable', value: null, unit: 'milliseconds', issue: { code: 'no_data', message: 'No samples.' } }
    snapshot.providers[0]!.metrics.errorRate = { state: 'unconfigured', value: null, unit: 'percent' }
    snapshot.providers[0]!.metrics.responseTime = { state: 'error', value: null, unit: 'milliseconds' }
    expect(() => parseMonitoringSnapshot(snapshot)).not.toThrow()
    const notProvided = backendSnapshot()
    expect(notProvided.providers[0]!.metrics.errorRate.state).toBe('not_provided')
  })
  it('separates provider partial retrieval from service availability and renders the successful metric', () => {
    const snapshot = backendSnapshot()
    snapshot.providers[1]!.state = 'partial'
    snapshot.providers[1]!.metrics.responseTime = { state: 'error', value: null, unit: 'milliseconds', issue: { code: 'upstream_error', message: 'Metric failed.' } }
    const view = render(toMonitoringView(parseMonitoringSnapshot(snapshot)))
    expect(view.text()).toContain('取得状態：一部の指標のみ取得')
    expect(view.text()).toContain('稼働状況は提供なし')
    expect(view.findAll('.metric-pair dd').map(node => node.text())).toEqual(['提供なし', '提供なし', '0%', '取得失敗'])
    expect(view.text()).toContain('Metric failed.')
  })
  it('renders provider and availability state separately for all provider states', () => {
    const snapshot = backendSnapshot()
    snapshot.providers[0] = {
      ...snapshot.providers[0]!, state: 'error', fetchedAt: null,
      availability: { state: 'unavailable', value: null }, issue: { code: 'upstream_error', message: 'Provider failed.' },
      metrics: {
        errorRate: { state: 'unavailable', value: null, unit: 'percent' },
        responseTime: { state: 'error', value: null, unit: 'milliseconds' },
      },
    }
    snapshot.providers[1] = {
      ...snapshot.providers[1]!, state: 'unconfigured', fetchedAt: null,
      metrics: {
        errorRate: { state: 'unconfigured', value: null, unit: 'percent' },
        responseTime: { state: 'unconfigured', value: null, unit: 'milliseconds' },
      },
    }
    const view = render(toMonitoringView(parseMonitoringSnapshot(snapshot)))
    expect(view.text()).toContain('取得状態：取得失敗')
    expect(view.text()).toContain('取得状態：未設定')
    expect(view.text()).toContain('稼働状況を取得できません')
    expect(view.findAll('.metric-pair dd').map(node => node.text())).toEqual(['データなし', '取得失敗', '未設定', '未設定'])
  })
  it('marks an old metric observation as historical without treating a recent fetch as stale', () => {
    const snapshot = backendSnapshot()
    snapshot.providers[1]!.metrics.errorRate.observedAt = '2020-01-01T00:00:00Z'
    const viewModel = toMonitoringView(parseMonitoringSnapshot(snapshot))
    expect(isProviderStale(viewModel.providers[1]!, Date.parse('2026-09-28T01:01:00Z'))).toBe(false)
    expect(isMetricStale(viewModel.providers[1]!.metrics.errorRate, Date.parse('2026-09-28T01:01:00Z'))).toBe(true)
    const view = render(viewModel)
    expect(view.text()).toContain('過去の観測：0%')
    expect(view.findAll('.badge.positive')).toHaveLength(1)
  })
  it('shows loading and transport errors instead of stale provider cards', async () => {
    const view = render()
    await view.setProps({ error: 'API稼働情報を取得できませんでした。' })
    expect(view.find('[role="alert"]').text()).toContain('取得できません')
    expect(view.findAll('.provider-card')).toHaveLength(0)
    await view.setProps({ loading: true })
    expect(view.find('[role="status"]').text()).toContain('取得しています')
    expect(view.find('button').attributes('disabled')).toBeDefined()
  })
  it('uses explicit unconfigured defaults while the feature is disabled', () => {
    const view = render(unconfiguredMonitoring())
    expect(view.text()).toContain('取得状態：未設定')
    expect(view.text()).toContain('提供なし')
    expect(view.text()).not.toContain('正常稼働')
  })
})
