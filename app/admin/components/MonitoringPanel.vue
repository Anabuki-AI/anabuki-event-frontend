<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { conditionLabels, monitoringStateLabels, monitoringStateDescriptions, providerLabels, isMonitoringStale, type MonitoringSnapshot } from '../monitoring-contract'
import { formatConsoleDate } from '../console-presentation'

defineProps<{ snapshot: MonitoringSnapshot; loading: boolean; error: string; enabled: boolean }>()
defineEmits<{ refresh: [] }>()
const now = ref(Date.now())
let clock: ReturnType<typeof setInterval> | undefined
onMounted(() => { clock = setInterval(() => { now.value = Date.now() }, 30_000) })
onUnmounted(() => clearInterval(clock))
</script>

<template>
  <section class="surface" aria-labelledby="monitoring-title" :aria-busy="loading">
    <div class="section-heading">
      <div><p class="kicker">CONNECTED SOURCES</p><h2 id="monitoring-title">外部サービスの監視</h2></div>
      <button v-if="enabled" class="button secondary" :disabled="loading" @click="$emit('refresh')"><PortalIcon name="refresh" />{{ loading ? '更新中…' : '監視データを更新' }}</button>
      <span v-else class="badge neutral">連携待ち</span>
    </div>
    <p class="section-description">Statuspage の稼働情報と Datadog の観測値を、情報源ごとに表示します。</p>
    <p v-if="loading" class="empty-inline" role="status">監視データを取得しています…</p>
    <div v-else-if="error" class="feedback error" role="alert">{{ error }}</div>
    <div v-else class="provider-grid">
      <article v-for="source in snapshot.sources" :key="source.provider" class="provider-card">
        <div class="provider-name"><span class="provider-symbol" aria-hidden="true">{{ source.provider === 'statuspage' ? 'S' : 'D' }}</span><h3>{{ providerLabels[source.provider] }}</h3></div>
        <template v-if="source.state === 'ready'">
          <span class="badge" :class="isMonitoringStale(source, now) || source.condition === 'unknown' ? 'neutral' : source.condition === 'operational' ? 'positive' : 'warning'">{{ isMonitoringStale(source, now) ? '過去の観測：' : '' }}{{ conditionLabels[source.condition] }}</span>
          <p v-if="isMonitoringStale(source, now)" class="source-note">更新が遅れています。現在の稼働状況として判断しないでください。</p>
          <dl class="metric-pair">
            <div><dt>エラーレート</dt><dd>{{ source.metrics.errorRatePercent === null ? '未取得' : `${source.metrics.errorRatePercent}%` }}</dd></div>
            <div><dt>レスポンス時間</dt><dd>{{ source.metrics.responseTimeMs === null ? '未取得' : `${source.metrics.responseTimeMs} ms` }}</dd></div>
          </dl>
          <p class="source-note">{{ source.metrics.windowLabel ? `集計：${source.metrics.windowLabel}` : 'この情報源の集計指標は未連携です。' }}</p>
        </template>
        <template v-else>
          <span class="badge" :class="source.state === 'unconfigured' ? 'neutral' : 'warning'">{{ monitoringStateLabels[source.state] }}</span>
          <p class="source-note">{{ monitoringStateDescriptions[source.state] }}</p>
          <dl class="metric-pair"><div><dt>エラーレート</dt><dd>未取得</dd></div><div><dt>レスポンス時間</dt><dd>未取得</dd></div></dl>
        </template>
        <dl class="source-times"><div><dt>情報源の更新</dt><dd>{{ source.updatedAt ? formatConsoleDate(source.updatedAt) : '未取得' }}</dd></div><div><dt>サーバーの取得</dt><dd>{{ source.fetchedAt ? formatConsoleDate(source.fetchedAt) : '未取得' }}</dd></div></dl>
      </article>
    </div>
    <p class="footnote">日時は日本時間。未取得は 0%・0 ms を意味しません。連携設定と認証情報はサーバー側で管理します。</p>
  </section>
</template>
