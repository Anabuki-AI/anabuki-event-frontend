// Wire contract for Rails GET /api/admin/api-status. External providers are
// queried only by Rails; credentials and metric queries never reach the browser.
export type MonitoringProvider = 'statuspage' | 'datadog'
export type MonitoringProviderState = 'available' | 'partial' | 'unconfigured' | 'error'
export type MonitoringAvailabilityState = 'available' | 'unavailable' | 'not_provided'
export type MonitoringCondition = 'operational' | 'degraded' | 'partial_outage' | 'major_outage' | 'unknown'
export type MonitoringMetricState = 'available' | 'unconfigured' | 'unavailable' | 'error' | 'not_provided'
export type MonitoringMetricUnit = 'percent' | 'milliseconds'

export interface MonitoringIssue { code: string; message: string }
export interface MonitoringMetricWire {
  state: MonitoringMetricState
  value: number | null
  unit: MonitoringMetricUnit
  observedAt?: string | null
  fetchedAt?: string | null
  issue?: MonitoringIssue | null
}
export interface MonitoringAvailabilityWire {
  state: MonitoringAvailabilityState
  value: MonitoringCondition | null
  externalStatus?: string | null
}
export interface MonitoringProviderWire {
  provider: MonitoringProvider
  source: string
  state: MonitoringProviderState
  fetchedAt: string | null
  availability: MonitoringAvailabilityWire
  metrics: { errorRate: MonitoringMetricWire; responseTime: MonitoringMetricWire }
  issue?: MonitoringIssue | null
}
export interface MonitoringSnapshotWire {
  generatedAt: string
  cached: boolean
  providers: MonitoringProviderWire[]
}

// The view model is deliberately separate from the wire type. It contains no
// derived provider update time, aggregation window, or synthetic metric value.
export type MonitoringMetricView = MonitoringMetricWire
export interface MonitoringProviderView extends Omit<MonitoringProviderWire, 'metrics'> {
  metrics: { errorRate: MonitoringMetricView; responseTime: MonitoringMetricView }
}
export interface MonitoringSnapshot {
  generatedAt: string | null
  cached: boolean
  providers: MonitoringProviderView[]
}

export const providerLabels: Record<MonitoringProvider, string> = { statuspage: 'Atlassian Statuspage', datadog: 'Datadog' }
export const providerStateLabels: Record<MonitoringProviderState, string> = {
  available: '取得済み', partial: '一部の指標のみ取得', unconfigured: '未設定', error: '取得失敗',
}
export const conditionLabels: Record<MonitoringCondition, string> = {
  operational: '正常稼働', degraded: '性能低下', partial_outage: '部分障害', major_outage: '広範囲の障害', unknown: '稼働状況は不明',
}
export const availabilityStateLabels: Record<MonitoringAvailabilityState, string> = {
  available: '稼働状況を取得', unavailable: '稼働状況を取得できません', not_provided: '稼働状況は提供なし',
}
export const metricStateLabels: Record<MonitoringMetricState, string> = {
  available: '取得済み', unconfigured: '未設定', unavailable: 'データなし', error: '取得失敗', not_provided: '提供なし',
}

export function unconfiguredMonitoring(): MonitoringSnapshot {
  return {
    generatedAt: null,
    cached: false,
    providers: (['statuspage', 'datadog'] as const).map(provider => ({
      provider,
      source: providerLabels[provider],
      state: 'unconfigured',
      fetchedAt: null,
      availability: { state: provider === 'statuspage' ? 'unavailable' : 'not_provided', value: null },
      metrics: {
        errorRate: { state: 'not_provided', value: null, unit: 'percent' },
        responseTime: { state: 'not_provided', value: null, unit: 'milliseconds' },
      },
    })),
  }
}

const staleAfterMs = 5 * 60_000
export function isTimestampStale(value: string | null | undefined, now = Date.now()) {
  return !value || now - Date.parse(value) > staleAfterMs
}
export function isProviderStale(provider: MonitoringProviderView, now = Date.now()) {
  return isTimestampStale(provider.fetchedAt, now)
}
export function isMetricStale(metric: MonitoringMetricView, now = Date.now()) {
  // Datadog observation time is the relevant freshness signal when supplied;
  // otherwise only the metric fetch time can be evaluated.
  return isTimestampStale(metric.observedAt ?? metric.fetchedAt, now)
}

function record(value: unknown): value is Record<string, unknown> { return typeof value === 'object' && value !== null }
function timestamp(value: unknown): value is string | null { return value === null || (typeof value === 'string' && Number.isFinite(Date.parse(value))) }
function issue(value: unknown): value is MonitoringIssue | null | undefined {
  return value === undefined || value === null || (record(value) && typeof value.code === 'string' && typeof value.message === 'string')
}
function condition(value: unknown): value is MonitoringCondition | null {
  return value === null || (typeof value === 'string' && ['operational', 'degraded', 'partial_outage', 'major_outage', 'unknown'].includes(value))
}

function parseMetric(value: unknown, unit: MonitoringMetricUnit): MonitoringMetricWire {
  if (!record(value) || !['available', 'unconfigured', 'unavailable', 'error', 'not_provided'].includes(String(value.state))
    || value.unit !== unit || !('value' in value) || !(value.value === null || (typeof value.value === 'number' && Number.isFinite(value.value)))
    || !('observedAt' in value ? timestamp(value.observedAt) : true)
    || !('fetchedAt' in value ? timestamp(value.fetchedAt) : true) || !issue(value.issue)
    || (value.state === 'available' && typeof value.value !== 'number')
    || (value.state !== 'available' && value.value !== null)) {
    throw new Error(`Invalid api-status metric: ${unit}`)
  }
  return value as unknown as MonitoringMetricWire
}

function parseProvider(value: unknown): MonitoringProviderWire {
  if (!record(value) || !['statuspage', 'datadog'].includes(String(value.provider)) || typeof value.source !== 'string'
    || !['available', 'partial', 'unconfigured', 'error'].includes(String(value.state)) || !timestamp(value.fetchedAt)
    || !record(value.availability) || !['available', 'unavailable', 'not_provided'].includes(String(value.availability.state))
    || !condition(value.availability.value) || !issue(value.issue)
    || !(value.availability.externalStatus === undefined || value.availability.externalStatus === null || typeof value.availability.externalStatus === 'string')
    || !record(value.metrics)
    || (value.availability.state === 'available' && value.availability.value === null)
    || (value.availability.state !== 'available' && value.availability.value !== null)) {
    throw new Error('Invalid api-status provider')
  }
  return {
    ...(value as unknown as Omit<MonitoringProviderWire, 'metrics'>),
    metrics: {
      errorRate: parseMetric(value.metrics.errorRate, 'percent'),
      responseTime: parseMetric(value.metrics.responseTime, 'milliseconds'),
    },
  }
}

// Fail closed: both known providers and both metric objects are required.
export function parseMonitoringSnapshot(value: unknown): MonitoringSnapshotWire {
  if (!record(value) || !timestamp(value.generatedAt) || value.generatedAt === null || typeof value.cached !== 'boolean'
    || !Array.isArray(value.providers) || value.providers.length !== 2) {
    throw new Error('Invalid api-status snapshot')
  }
  const providers = value.providers.map(parseProvider)
  if (new Set(providers.map(provider => provider.provider)).size !== 2) throw new Error('Invalid api-status providers')
  return { generatedAt: value.generatedAt, cached: value.cached, providers }
}

export function toMonitoringView(snapshot: MonitoringSnapshotWire): MonitoringSnapshot {
  return {
    generatedAt: snapshot.generatedAt,
    cached: snapshot.cached,
    providers: snapshot.providers.map(provider => ({
      ...provider,
      availability: { ...provider.availability },
      metrics: { errorRate: { ...provider.metrics.errorRate }, responseTime: { ...provider.metrics.responseTime } },
    })),
  }
}
