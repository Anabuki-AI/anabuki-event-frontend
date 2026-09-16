// Frontend/backend boundary: providers are queried server-side only. No API keys
// or direct Statuspage/Datadog requests belong in the browser.
export type MonitoringProvider = 'statuspage' | 'datadog'
export type MonitoringState = 'unconfigured' | 'unauthenticated' | 'forbidden' | 'error' | 'ready'
export type ServiceCondition = 'operational' | 'degraded' | 'partial_outage' | 'major_outage' | 'unknown'
export interface MonitoringSource {
  provider: MonitoringProvider
  state: MonitoringState
  condition: ServiceCondition
  fetchedAt: string | null
  updatedAt: string | null
  stale: boolean
  metrics: {
    errorRatePercent: number | null
    responseTimeMs: number | null
    windowLabel: string | null
  }
}
export interface MonitoringSnapshot { sources: MonitoringSource[] }

export const providerLabels: Record<MonitoringProvider, string> = { statuspage: 'Atlassian Statuspage', datadog: 'Datadog' }
export const conditionLabels: Record<ServiceCondition, string> = {
  operational: '正常稼働', degraded: '性能低下', partial_outage: '部分障害', major_outage: '広範囲の障害', unknown: '稼働状況は不明',
}
export const monitoringStateLabels: Record<Exclude<MonitoringState, 'ready'>, string> = {
  unconfigured: '未設定・未連携', unauthenticated: '連携先の認証が必要', forbidden: '連携先への権限不足', error: '取得失敗',
}
export const monitoringStateDescriptions: Record<Exclude<MonitoringState, 'ready'>, string> = {
  unconfigured: 'サーバー側で監視サービスを設定すると、ここに観測結果が表示されます。',
  unauthenticated: '監視サービスの認証情報を管理担当者に確認してください。Googleへの再ログインでは解消しません。',
  forbidden: '監視サービスを読み取る権限が不足しています。管理担当者へ確認してください。',
  error: '監視データを取得できませんでした。サービスの停止を意味するものではありません。',
}

export function unconfiguredMonitoring(): MonitoringSnapshot {
  return { sources: (['statuspage', 'datadog'] as const).map(provider => ({
    provider, state: 'unconfigured', condition: 'unknown', fetchedAt: null, updatedAt: null, stale: false,
    metrics: { errorRatePercent: null, responseTimeMs: null, windowLabel: null },
  })) }
}

// Last fetch freshness, not the time of the last incident/change at the provider.
export function isMonitoringStale(source: MonitoringSource, now = Date.now()) {
  return source.stale || !source.fetchedAt || now - Date.parse(source.fetchedAt) > 5 * 60_000
}

function record(value: unknown): value is Record<string, unknown> { return typeof value === 'object' && value !== null }
function timestamp(value: unknown): value is string | null { return value === null || (typeof value === 'string' && Number.isFinite(Date.parse(value))) }
function metric(value: unknown, max = Infinity): value is number | null { return value === null || (typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= max) }

// Fail closed on a malformed/partial contract. Missing providers must not silently
// disappear, and missing metrics must never be coerced to zero.
export function parseMonitoringSnapshot(value: unknown): MonitoringSnapshot {
  if (!record(value) || !Array.isArray(value.sources) || value.sources.length !== 2) throw new Error('Invalid monitoring snapshot')
  const providers = new Set<string>()
  for (const source of value.sources) {
    if (!record(source) || !['statuspage', 'datadog'].includes(String(source.provider)) || providers.has(String(source.provider))
      || !['unconfigured', 'unauthenticated', 'forbidden', 'error', 'ready'].includes(String(source.state))
      || !['operational', 'degraded', 'partial_outage', 'major_outage', 'unknown'].includes(String(source.condition))
      || !timestamp(source.fetchedAt) || !timestamp(source.updatedAt) || typeof source.stale !== 'boolean'
      || !record(source.metrics) || !metric(source.metrics.errorRatePercent, 100) || !metric(source.metrics.responseTimeMs)
      || !(source.metrics.windowLabel === null || typeof source.metrics.windowLabel === 'string')
      || (source.state === 'ready' && (!source.fetchedAt || !source.updatedAt))
      || ((source.metrics.errorRatePercent !== null || source.metrics.responseTimeMs !== null) && !source.metrics.windowLabel)) {
      throw new Error('Invalid monitoring source')
    }
    providers.add(String(source.provider))
  }
  return value as unknown as MonitoringSnapshot
}
