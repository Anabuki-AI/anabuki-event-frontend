import { onUnmounted, ref } from 'vue'
import { auditLogApi } from '../api/audit-logs'
import { parseAuditLogPage, type AuditLogEntry, type AuditLogPage, type AuditLogType } from '~/features/admin/audit-log-contract'
import { ApiError } from '~/lib/api/error'

export const AUDIT_LOG_PER_PAGE = 50

// Local filter state; type 'ALL' means the backend is not asked to filter.
export interface AuditLogFilters {
  type: AuditLogType | 'ALL'
  from: string
  to: string
}

// Contract: no automatic retries, manual refresh/paging, and an explicit
// distinction between empty results, stale results, and failures. A 400 keeps
// the previous page visible but marks it stale instead of showing an empty table.
export function useAuditLogs(onAccessLost: () => Promise<void>, enabled = false) {
  const entries = ref<AuditLogEntry[]>([])
  const page = ref(1)
  const perPage = AUDIT_LOG_PER_PAGE
  const totalEntries = ref(0)
  const loading = ref(false)
  const loaded = ref(false)
  const error = ref('')
  const staleNotice = ref('')
  const filters = ref<AuditLogFilters>({ type: 'ALL', from: '', to: '' })
  let disposed = false
  onUnmounted(() => { disposed = true })

  function invalidRange() {
    return filters.value.from !== '' && filters.value.to !== '' && filters.value.from > filters.value.to
  }

  function toRFC3339(value: string): string | undefined {
    if (value === '') return undefined
    const date = new Date(value)
    return Number.isNaN(date.getTime()) ? undefined : date.toISOString()
  }

  async function load(nextPage = page.value) {
    if (!enabled || loading.value || disposed || invalidRange()) return
    loading.value = true
    error.value = ''
    staleNotice.value = ''
    try {
      const from = toRFC3339(filters.value.from)
      const to = toRFC3339(filters.value.to)
      if ((filters.value.from !== '' && !from) || (filters.value.to !== '' && !to)) {
        staleNotice.value = '期間の指定を解釈できませんでした。日時を入力し直してください。'
        return
      }
      const result: AuditLogPage = parseAuditLogPage(await auditLogApi.page({
        page: nextPage,
        perPage,
        types: filters.value.type === 'ALL' ? undefined : [filters.value.type],
        from,
        to,
      }))
      if (disposed) return
      entries.value = result.entries
      page.value = result.page
      totalEntries.value = result.totalEntries
      loaded.value = true
    }
    catch (cause) {
      if (disposed) return
      if (cause instanceof ApiError && cause.statusCode === 401) {
        error.value = 'ログインの有効期限を確認できません。再ログインしてください。'
        await onAccessLost()
      }
      else if (cause instanceof ApiError && cause.statusCode === 403) {
        error.value = '監査ログを表示する権限がありません。管理担当者へ確認してください。'
      }
      else if (cause instanceof ApiError && cause.statusCode === 400) {
        // Invalid query parameter: previous results stay visible but marked stale.
        staleNotice.value = '絞り込み条件に不正な値が含まれています。条件を確認してください。'
      }
      else error.value = '監査ログを取得できませんでした。バックエンドの状況を確認して再試行してください。'
    }
    finally {
      if (!disposed) loading.value = false
    }
  }

  function applyFilters(next: AuditLogFilters) {
    filters.value = next
    if (invalidRange()) {
      staleNotice.value = '期間の指定が不正です。「から」は「まで」より前にしてください。'
      return
    }
    void load(1)
  }

  function goToPage(nextPage: number) {
    if (nextPage < 1 || nextPage === page.value) return
    void load(nextPage)
  }

  return { entries, page, perPage, totalEntries, loading, loaded, error, staleNotice, filters, load, applyFilters, goToPage }
}

export type AuditLogFilterPayload = AuditLogFilters
export type AuditLogsState = ReturnType<typeof useAuditLogs>
