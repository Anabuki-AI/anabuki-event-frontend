<script setup lang="ts">
import { computed, ref } from 'vue'
import { auditLogTypeLabels, type AuditLogEntry, type AuditLogType } from '~/features/admin/audit-log-contract'
import { formatConsoleDate } from '../console-presentation'
import type { AuditLogFilterPayload, AuditLogsState } from '../composables/useAuditLogs'

const props = defineProps<{ state: AuditLogsState }>()
const emit = defineEmits<{ apply: [filters: AuditLogFilterPayload] }>()
// Local form state; committed only when submitted so paging/refresh keep the
// currently applied filters until the operator confirms new ones.
const form = ref<AuditLogFilterPayload>({ type: 'ALL', from: '', to: '' })
const typeOptions = (Object.keys(auditLogTypeLabels) as AuditLogType[]).map(type => ({ value: type, label: auditLogTypeLabels[type] }))
const resetDetailFields = [
  ['participantsDeleted', '参加者'],
  ['participantSessionsDeleted', '参加者セッション'],
  ['participantAnswersDeleted', '回答'],
  ['confidenceSelectionsDeleted', '自信度選択'],
  ['questionRevealsReset', '問題の公開履歴'],
  ['quizSessionsReset', 'クイズセッション'],
] as const
function formatOperationDate(value: string | null) {
  return value ? formatConsoleDate(value) : '—'
}
function formatResetCount(entry: AuditLogEntry, key: string) {
  const value = entry.detail[key]
  return typeof value === 'number' ? `${value}件` : '—'
}
const totalPages = computed(() => Math.max(1, Math.ceil(props.state.totalEntries.value / props.state.perPage)))
const rangeStart = computed(() => (props.state.totalEntries.value === 0 ? 0 : (props.state.page.value - 1) * props.state.perPage + 1))
const rangeEnd = computed(() => Math.min(props.state.page.value * props.state.perPage, props.state.totalEntries.value))
function apply() {
  emit('apply', { ...form.value })
}
</script>

<template>
  <section class="surface audit-log-panel" :aria-busy="state.loading.value">
    <div class="section-heading">
      <div><p class="kicker">AUDIT TRAIL</p><h2 id="audit-log-title">操作・エラーログ</h2></div>
      <button class="button secondary" :disabled="state.loading.value" @click="state.load()"><PortalIcon name="refresh" />{{ state.loading.value ? '更新中…' : '一覧を更新' }}</button>
    </div>
    <p class="section-description">バックエンドに記録された管理操作の履歴です。失敗した操作は記録されません。ブラウザ内に履歴を保存することはありません。</p>

    <form class="audit-filters" @submit.prevent="apply">
      <label>操作内容
        <select v-model="form.type">
          <option value="ALL">すべて</option>
          <option v-for="option in typeOptions" :key="option.value" :value="option.value">{{ option.label }}</option>
        </select>
      </label>
      <label>期間（から）
        <input v-model="form.from" type="datetime-local">
      </label>
      <label>期間（まで）
        <input v-model="form.to" type="datetime-local">
      </label>
      <button class="button secondary" type="submit" :disabled="state.loading.value">絞り込む</button>
    </form>

    <div v-if="state.staleNotice.value" class="feedback warning" role="status">{{ state.staleNotice.value }}<p class="footnote">以下の結果は絞り込み前の古い取得結果です。</p></div>
    <div v-if="state.error.value" class="feedback error" role="alert">{{ state.error.value }}</div>
    <p v-else-if="state.loading.value" class="empty-inline" role="status">監査ログを取得しています…</p>
    <div v-else-if="state.loaded.value" class="table-scroll" role="region" aria-labelledby="audit-log-title" tabindex="0">
      <table>
        <caption class="sr-only">監査ログの一覧。操作内容・実行ユーザー・日時を表示します。</caption>
        <thead><tr><th scope="col">操作内容</th><th scope="col">実行ユーザー</th><th scope="col">対象</th><th scope="col">処理結果</th><th scope="col">日時（日本時間）</th></tr></thead>
        <tbody>
          <tr v-for="entry in state.entries.value" :key="entry.id">
            <td>{{ auditLogTypeLabels[entry.type] }}</td>
            <td><span class="table-email">{{ entry.actorEmail ?? '（システム）' }}</span></td>
            <td>{{ entry.targetType ? `${entry.targetType} #${entry.targetId ?? '—'}` : '—' }}</td>
            <td>
              <div v-if="entry.type === 'TOURNAMENT_RESET'" class="audit-reset-receipt">
                <strong>リセット受付票</strong>
                <span>操作ID: <code>{{ entry.operationId ?? '—' }}</code></span>
                <span>開始: {{ formatOperationDate(entry.operationStartedAt) }}</span>
                <span>完了: {{ formatOperationDate(entry.operationCompletedAt) }}</span>
                <ul>
                  <li v-for="[key, label] in resetDetailFields" :key="key">{{ label }}: {{ formatResetCount(entry, key) }}</li>
                </ul>
              </div>
              <span v-else>—</span>
            </td>
            <td>{{ formatConsoleDate(entry.occurredAt) }}</td>
          </tr>
          <tr v-if="!state.entries.value.length"><td colspan="5" class="empty-inline">この条件で取得できた記録は 0 件です。条件を変えるか、後ほど再取得してください。将来の記録の有無を意味するものではありません。</td></tr>
        </tbody>
      </table>
    </div>
    <div v-else class="empty-state compact"><span class="empty-illustration"><PortalIcon name="logs" /></span><h3>まだ監査ログを取得していません</h3><p>「一覧を更新」で最新の記録を取得できます。</p></div>

    <nav v-if="state.loaded.value && totalPages > 1" class="audit-pager" aria-label="監査ログのページ送り">
      <button class="button secondary" :disabled="state.loading.value || state.page.value <= 1" @click="state.goToPage(state.page.value - 1)">前へ</button>
      <span>{{ rangeStart }}–{{ rangeEnd }} 件 / 全 {{ state.totalEntries.value }} 件（{{ state.page.value }} / {{ totalPages }} ページ）</span>
      <button class="button secondary" :disabled="state.loading.value || state.page.value >= totalPages" @click="state.goToPage(state.page.value + 1)">次へ</button>
    </nav>
    <p v-else-if="state.loaded.value && state.entries.value.length" class="footnote">全 {{ state.totalEntries.value }} 件を表示しています。</p>
  </section>
</template>

<style scoped>
.audit-log-panel .audit-filters { display: flex; flex-wrap: wrap; align-items: end; gap: 14px; margin: 0 0 22px; }
.audit-log-panel .audit-filters label { display: flex; flex-direction: column; gap: 6px; color: #607169; font-size: 12px; }
.audit-log-panel .audit-filters select,
.audit-log-panel .audit-filters input { min-height: 42px; padding: 8px 12px; border: 1px solid #ccd8ca; border-radius: 6px; font: inherit; font-size: 13px; color: #23372e; background: #fff; }
.feedback.warning { background: #fff8e8; border: 1px solid #ecdcb4; color: #7a5a22; }
.audit-pager { display: flex; align-items: center; justify-content: space-between; gap: 14px; margin-top: 18px; color: #607169; font-size: 12px; }
.audit-reset-receipt { display: grid; gap: 3px; min-width: 260px; font-size: 12px; line-height: 1.45; }
.audit-reset-receipt strong { color: #7a3328; }
.audit-reset-receipt code { overflow-wrap: anywhere; color: #4d5e58; }
.audit-reset-receipt ul { display: grid; grid-template-columns: repeat(2, max-content); gap: 0 12px; margin: 3px 0 0; padding: 0; list-style: none; color: #607169; }
</style>
