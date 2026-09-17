// Contract for Rails GET /api/admin/api-status (AdminApiStatus service).
// The backend deliberately hides provider credentials and returns normalized
// values plus generic failure information. This parser fails closed on any
// malformed/partial payload: missing data must never be shown as a number.
export type ApiStatusProviderId = 'statuspage' | 'datadog'
export type ApiStatusProviderState = 'available' | 'partial' | 'unconfigured' | 'error'
export type ApiStatusAvailabilityState = 'available' | 'not_provided' | 'unavailable'
export type ApiStatusCondition = 'operational' | 'degraded' | 'partial_outage' | 'major_outage' | 'unknown'
export type ApiStatusMetricState = 'available' | 'not_provided' | 'unconfigured' | 'unavailable' | 'error'

export interface ApiStatusMetric {
  state: ApiStatusMetricState
  value: number | null
  unit: 'percent' | 'milliseconds'
  observedAt?: string | null
  issue?: { code: string, message: string } | null
}

export interface ApiStatusProvider {
  provider: ApiStatusProviderId
  source: string
  state: ApiStatusProviderState
  fetchedAt: string | null
  availability: { state: ApiStatusAvailabilityState, value: ApiStatusCondition | null, externalStatus?: string | null }
  metrics: { errorRate: ApiStatusMetric, responseTime: ApiStatusMetric }
  issue?: { code: string, message: string } | null
}

export interface ApiStatusSnapshot {
  generatedAt: string | null
  cached: boolean
  providers: ApiStatusProvider[]
}

export const apiStatusProviderLabels: Record<ApiStatusProviderId, string> = { statuspage: 'Atlassian Statuspage', datadog: 'Datadog' }
export const apiStatusProviderStateLabels: Record<ApiStatusProviderState, string> = {
  available: '稼働情報を取得',
  partial: '一部の指標のみ取得',
  unconfigured: '未設定・未連携',
  error: '取得失敗',
}
export const apiStatusConditionLabels: Record<ApiStatusCondition, string> = {
  operational: '正常稼働',
  degraded: '性能低下',
  partial_outage: '部分障害',
  major_outage: '広範囲の障害',
  unknown: '稼働状況は不明',
}
export const apiStatusMetricStateLabels: Record<ApiStatusMetricState, string> = {
  available: '取得済み',
  not_provided: '提供対象外',
  unconfigured: '未設定',
  unavailable: 'データなし',
  error: '取得失敗',
}

export function unconfiguredApiStatus(): ApiStatusSnapshot {
  return {
    generatedAt: null,
    cached: false,
    providers: (['statuspage', 'datadog'] as const).map(provider => ({
      provider,
      source: apiStatusProviderLabels[provider],
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

function record(value: unknown): value is Record<string, unknown> { return typeof value === 'object' && value !== null }

function condition(value: unknown): value is ApiStatusCondition | null {
  return value === null || (typeof value === 'string' && ['operational', 'degraded', 'partial_outage', 'major_outage', 'unknown'].includes(value))
}

function timestamp(value: unknown): value is string | null { return value === null || (typeof value === 'string' && Number.isFinite(Date.parse(value))) }

function parseMetric(value: unknown, unit: 'percent' | 'milliseconds'): ApiStatusMetric {
  if (!record(value) || !['available', 'not_provided', 'unconfigured', 'unavailable', 'error'].includes(String(value.state))
    || !(value.value === null || (typeof value.value === 'number' && Number.isFinite(value.value)))
    || value.unit !== unit
    || !('observedAt' in value ? timestamp(value.observedAt) : true)
    || !(value.issue === undefined || value.issue === null || (record(value.issue) && typeof value.issue.code === 'string' && typeof value.issue.message === 'string'))) {
    throw new Error(`Invalid api-status metric: ${unit}`)
  }
  return value as unknown as ApiStatusMetric
}

function parseProvider(value: unknown): ApiStatusProvider {
  if (!record(value) || !['statuspage', 'datadog'].includes(String(value.provider)) || typeof value.source !== 'string'
    || !['available', 'partial', 'unconfigured', 'error'].includes(String(value.state))
    || !timestamp(value.fetchedAt)
    || !record(value.availability) || !['available', 'not_provided', 'unavailable'].includes(String(value.availability.state))
    || !condition(value.availability.value)
    || !(value.availability.externalStatus === undefined || value.availability.externalStatus === null || typeof value.availability.externalStatus === 'string')
    || !record(value.metrics)
    || !(value.issue === undefined || value.issue === null || (record(value.issue) && typeof value.issue.code === 'string' && typeof value.issue.message === 'string'))) {
    throw new Error('Invalid api-status provider')
  }
  return {
    ...(value as unknown as ApiStatusProvider),
    metrics: {
      errorRate: parseMetric(value.metrics.errorRate, 'percent'),
      responseTime: parseMetric(value.metrics.responseTime, 'milliseconds'),
    },
  }
}

export function parseApiStatusSnapshot(value: unknown): ApiStatusSnapshot {
  if (!record(value) || !Array.isArray(value.providers) || value.providers.length !== 2
    || !timestamp(value.generatedAt) || typeof value.cached !== 'boolean') {
    throw new Error('Invalid api-status snapshot')
  }
  const providers = value.providers.map(provider => parseProvider(provider))
  return { generatedAt: value.generatedAt, cached: value.cached, providers }
}
