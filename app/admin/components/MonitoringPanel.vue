<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import {
  availabilityStateLabels,
  conditionLabels,
  isMetricStale,
  isProviderStale,
  metricStateLabels,
  providerLabels,
  providerStateLabels,
  type MonitoringMetricView,
  type MonitoringProviderView,
  type MonitoringSnapshot,
} from '../monitoring-contract'
import { formatConsoleDate } from '../console-presentation'

defineProps<{ snapshot: MonitoringSnapshot; loading: boolean; error: string; enabled: boolean }>()
defineEmits<{ refresh: [] }>()
const now = ref(Date.now())
let clock: ReturnType<typeof setInterval> | undefined
onMounted(() => { clock = setInterval(() => { now.value = Date.now() }, 30_000) })
onUnmounted(() => clearInterval(clock))

function providerBadgeClass(provider: MonitoringProviderView) {
  return provider.state === 'unconfigured' ? 'neutral' : provider.state === 'error' ? 'warning' : 'neutral'
}
function availabilityBadgeClass(provider: MonitoringProviderView) {
  if (isProviderStale(provider, now.value) || provider.availability.state !== 'available' || provider.availability.value === 'unknown') return 'neutral'
  return provider.availability.value === 'operational' ? 'positive' : 'warning'
}
function metricText(metric: MonitoringMetricView) {
  if (metric.state !== 'available' || metric.value === null) return metricStateLabels[metric.state]
  const value = metric.unit === 'percent' ? `${metric.value}%` : `${metric.value} ms`
  return isMetricStale(metric, now.value) ? `過去の観測：${value}` : value
}
function metricObservation(metric: MonitoringMetricView) {
  return metric.observedAt ?? metric.fetchedAt ?? null
}
</script>

<template>
  <section class="surface" aria-labelledby="monitoring-title" :aria-busy="loading">
    <div class="section-heading">
      <div><p class="kicker">BACKEND API STATUS</p><h2 id="monitoring-title">バックエンドAPIの稼働情報</h2></div>
      <button v-if="enabled" class="button secondary" :disabled="loading" @click="$emit('refresh')"><PortalIcon name="refresh" />{{ loading ? '更新中…' : '稼働情報を更新' }}</button>
      <span v-else class="badge neutral">連携待ち</span>
    </div>
    <p class="section-description">Rails サーバーが取得した Statuspage の稼働情報と Datadog の観測値を、情報源ごとに表示します。</p>
    <p v-if="loading" class="empty-inline" role="status">API稼働情報を取得しています…</p>
    <div v-else-if="error" class="feedback error" role="alert">{{ error }}</div>
    <template v-else>
      <div class="provider-grid">
        <article v-for="provider in snapshot.providers" :key="provider.provider" class="provider-card">
          <div class="provider-name"><span class="provider-symbol" aria-hidden="true">{{ provider.provider === 'statuspage' ? 'S' : 'D' }}</span><h3>{{ provider.source || providerLabels[provider.provider] }}</h3></div>
          <span class="badge" :class="providerBadgeClass(provider)">取得状態：{{ providerStateLabels[provider.state] }}</span>
          <p v-if="provider.issue" class="source-note">{{ provider.issue.message }}</p>

          <template v-if="provider.availability.state === 'available' && provider.availability.value">
            <span class="badge" :class="availabilityBadgeClass(provider)">{{ isProviderStale(provider, now) ? '過去の取得：' : '' }}稼働状況：{{ conditionLabels[provider.availability.value] }}</span>
            <p v-if="provider.availability.externalStatus" class="source-note">{{ provider.availability.externalStatus }}</p>
            <p v-if="isProviderStale(provider, now)" class="source-note">サーバー取得時刻が古いため、現在の稼働状況として判断しないでください。</p>
          </template>
          <p v-else class="source-note">{{ availabilityStateLabels[provider.availability.state] }}</p>

          <dl class="metric-pair">
            <div><dt>エラーレート</dt><dd>{{ metricText(provider.metrics.errorRate) }}</dd><small v-if="provider.metrics.errorRate.issue">{{ provider.metrics.errorRate.issue.message }}</small></div>
            <div><dt>レスポンス時間</dt><dd>{{ metricText(provider.metrics.responseTime) }}</dd><small v-if="provider.metrics.responseTime.issue">{{ provider.metrics.responseTime.issue.message }}</small></div>
          </dl>
          <dl class="source-times">
            <div><dt>サーバーの取得</dt><dd>{{ provider.fetchedAt ? formatConsoleDate(provider.fetchedAt) : '未取得' }}</dd></div>
            <div><dt>エラーレート観測</dt><dd>{{ metricObservation(provider.metrics.errorRate) ? formatConsoleDate(metricObservation(provider.metrics.errorRate)!) : '未取得' }}</dd></div>
            <div><dt>応答時間観測</dt><dd>{{ metricObservation(provider.metrics.responseTime) ? formatConsoleDate(metricObservation(provider.metrics.responseTime)!) : '未取得' }}</dd></div>
          </dl>
        </article>
      </div>
      <p class="footnote">日時は日本時間。{{ snapshot.generatedAt ? `API生成：${formatConsoleDate(snapshot.generatedAt)}。` : '' }}{{ snapshot.cached ? 'キャッシュされた観測結果です。' : '' }}未設定・データなし・提供なし・取得失敗は 0%・0 ms を意味しません。連携設定と認証情報はサーバー側で管理します。</p>
    </template>
  </section>
</template>
