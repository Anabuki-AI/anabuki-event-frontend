<script setup lang="ts">
import { apiStatusConditionLabels, apiStatusMetricStateLabels, apiStatusProviderLabels, apiStatusProviderStateLabels, type ApiStatusMetric, type ApiStatusSnapshot } from '../api-status-contract'
import { formatConsoleDate } from '../console-presentation'

defineProps<{ snapshot: ApiStatusSnapshot; loading: boolean; error: string; enabled: boolean }>()
defineEmits<{ refresh: [] }>()

function metricText(metric: ApiStatusMetric) {
  if (metric.state !== 'available' || metric.value === null) return apiStatusMetricStateLabels[metric.state]
  return metric.unit === 'percent' ? `${metric.value}%` : `${metric.value} ms`
}
</script>

<template>
  <section class="surface" aria-labelledby="api-status-title" :aria-busy="loading">
    <div class="section-heading">
      <div><p class="kicker">BACKEND API STATUS</p><h2 id="api-status-title">バックエンドAPIの稼働情報</h2></div>
      <button v-if="enabled" class="button secondary" :disabled="loading" @click="$emit('refresh')"><PortalIcon name="refresh" />{{ loading ? '更新中…' : '稼働情報を更新' }}</button>
      <span v-else class="badge neutral">連携待ち</span>
    </div>
    <p class="section-description">Rails サーバー経由で取得した Statuspage の稼働情報と Datadog の観測値を表示します。</p>
    <p v-if="loading" class="empty-inline" role="status">API稼働情報を取得しています…</p>
    <div v-else-if="error" class="feedback error" role="alert">{{ error }}</div>
    <template v-else>
      <div class="provider-grid">
        <article v-for="provider in snapshot.providers" :key="provider.provider" class="provider-card">
          <div class="provider-name"><span class="provider-symbol" aria-hidden="true">{{ provider.provider === 'statuspage' ? 'S' : 'D' }}</span><h3>{{ apiStatusProviderLabels[provider.provider] }}</h3></div>
          <span class="badge" :class="provider.state === 'available' ? (provider.availability.value === 'operational' ? 'positive' : 'warning') : provider.state === 'unconfigured' ? 'neutral' : 'warning'">{{ apiStatusProviderStateLabels[provider.state] }}</span>
          <p v-if="provider.state === 'available' && provider.availability.value" class="source-note">稼働状況：{{ apiStatusConditionLabels[provider.availability.value] }}<template v-if="provider.availability.externalStatus">（{{ provider.availability.externalStatus }}）</template></p>
          <p v-if="provider.issue" class="source-note">{{ provider.issue.message }}</p>
          <dl class="metric-pair">
            <div><dt>エラーレート</dt><dd>{{ metricText(provider.metrics.errorRate) }}</dd></div>
            <div><dt>レスポンス時間</dt><dd>{{ metricText(provider.metrics.responseTime) }}</dd></div>
          </dl>
          <dl class="source-times"><div><dt>サーバーの取得</dt><dd>{{ provider.fetchedAt ? formatConsoleDate(provider.fetchedAt) : '未取得' }}</dd></div></dl>
        </article>
      </div>
      <p class="footnote">日時は日本時間。{{ snapshot.cached ? 'キャッシュされた最新の観測結果です。' : '' }}未取得は 0%・0 ms を意味しません。連携設定と認証情報はサーバー側で管理します。</p>
    </template>
  </section>
</template>
