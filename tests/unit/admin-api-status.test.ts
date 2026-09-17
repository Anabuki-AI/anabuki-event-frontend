import { afterEach, describe, expect, it } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import ApiStatusPanel from '~/admin/components/ApiStatusPanel.vue'
import { parseApiStatusSnapshot, unconfiguredApiStatus, type ApiStatusSnapshot } from '~/admin/api-status-contract'

let wrapper: VueWrapper
function render(overrides: Partial<ApiStatusSnapshot> = {}) {
  const snapshot = unconfiguredApiStatus()
  Object.assign(snapshot, overrides)
  wrapper = mount(ApiStatusPanel, { props: { snapshot, enabled: true, loading: false, error: '' } })
  return wrapper
}
function availableSnapshot(): ApiStatusSnapshot {
  const snapshot = unconfiguredApiStatus()
  snapshot.generatedAt = new Date().toISOString()
  snapshot.providers[0] = {
    ...snapshot.providers[0]!,
    state: 'available',
    fetchedAt: new Date().toISOString(),
    availability: { state: 'available', value: 'operational', externalStatus: 'All Systems Operational' },
  }
  snapshot.providers[1] = {
    ...snapshot.providers[1]!,
    state: 'available',
    fetchedAt: new Date().toISOString(),
    availability: { state: 'not_provided', value: null },
    metrics: {
      errorRate: { state: 'available', value: 0.42, unit: 'percent' },
      responseTime: { state: 'available', value: 120, unit: 'milliseconds', observedAt: new Date().toISOString() },
    },
  }
  return snapshot
}
afterEach(() => wrapper?.unmount())

describe('api-status contract parsing', () => {
  it('parses a complete backend snapshot including cached flag', () => {
    const raw = { generatedAt: '2026-09-28T01:00:00Z', cached: true, providers: availableSnapshot().providers }
    const snapshot = parseApiStatusSnapshot(raw)
    expect(snapshot.cached).toBe(true)
    expect(snapshot.providers.map(provider => provider.provider)).toEqual(['statuspage', 'datadog'])
  })
  it('keeps zero-valued metrics instead of treating them as missing', () => {
    const snapshot = availableSnapshot()
    snapshot.providers[1]!.metrics.errorRate.value = 0
    const parsed = parseApiStatusSnapshot(snapshot)
    expect(parsed.providers[1]!.metrics.errorRate.value).toBe(0)
  })
  it.each([
    {}, { generatedAt: null, cached: false, providers: [] }, { generatedAt: 'invalid', cached: false, providers: availableSnapshot().providers },
    { generatedAt: '2026-09-28T01:00:00Z', cached: 'yes', providers: availableSnapshot().providers },
  ])('rejects malformed snapshots: %j', (value) => {
    expect(() => parseApiStatusSnapshot(value)).toThrow()
  })
  it('rejects providers with unknown states or non-numeric metric values', () => {
    const snapshot = availableSnapshot()
    snapshot.providers[0]!.state = 'ready'
    expect(() => parseApiStatusSnapshot(snapshot)).toThrow()
    snapshot.providers[0]!.state = 'available'
    snapshot.providers[1]!.metrics.errorRate.value = '0.4'
    expect(() => parseApiStatusSnapshot(snapshot)).toThrow()
    snapshot.providers[1]!.metrics.errorRate.value = 0.4
    snapshot.providers[1]!.metrics.responseTime.unit = 'percent'
    expect(() => parseApiStatusSnapshot(snapshot)).toThrow()
  })
  it('accepts per-provider failure details for unconfigured integrations', () => {
    const snapshot = unconfiguredApiStatus()
    snapshot.generatedAt = new Date().toISOString()
    snapshot.providers[0]!.issue = { code: 'unconfigured', message: 'Configure STATUSPAGE_PUBLIC_SUMMARY_URL.' }
    const parsed = parseApiStatusSnapshot(snapshot)
    expect(parsed.providers[0]!.issue?.code).toBe('unconfigured')
  })
})

describe('api-status panel presentation', () => {
  it('shows unconfigured integrations without inventing metrics', () => {
    const view = render()
    expect(view.text()).toContain('未設定・未連携')
    expect(view.text()).not.toContain('正常稼働')
    expect(view.findAll('.metric-pair dd').map(node => node.text())).toEqual(['提供対象外', '提供対象外', '提供対象外', '提供対象外'])
  })
  it('renders operational availability and real metric values with units', () => {
    const view = render(availableSnapshot())
    expect(view.text()).toContain('正常稼働')
    expect(view.findAll('.metric-pair dd').map(node => node.text())).toEqual(['提供対象外', '提供対象外', '0.42%', '120 ms'])
  })
  it('shows provider failure messages instead of fabricated numbers', () => {
    const snapshot = unconfiguredApiStatus()
    snapshot.providers[0]!.state = 'error'
    snapshot.providers[0]!.issue = { code: 'upstream_error', message: 'Statuspage data could not be retrieved.' }
    const view = render(snapshot)
    expect(view.text()).toContain('Statuspage data could not be retrieved.')
    expect(view.findAll('.badge.warning')).toHaveLength(1)
  })
  it('handles loading and error states like other console panels', async () => {
    const view = render()
    await view.setProps({ error: 'API稼働情報を取得できませんでした。' })
    expect(view.find('[role="alert"]').text()).toBe('API稼働情報を取得できませんでした。')
    expect(view.findAll('.provider-card')).toHaveLength(0)
    await view.setProps({ loading: true })
    expect(view.find('[role="status"]').text()).toContain('取得しています')
    expect(view.find('button').attributes('disabled')).toBeDefined()
  })
  it('hides the refresh action while the flag is disabled', () => {
    wrapper = mount(ApiStatusPanel, { props: { snapshot: unconfiguredApiStatus(), enabled: false, loading: false, error: '' } })
    expect(wrapper.find('button').exists()).toBe(false)
    expect(wrapper.text()).toContain('連携待ち')
  })
})
