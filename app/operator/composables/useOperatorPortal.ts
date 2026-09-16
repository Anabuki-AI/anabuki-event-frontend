import { computed, onMounted, onUnmounted, ref } from 'vue'
import { operatorAuthApi } from '../api/operator-auth'
import { detectAccessRequestDecision, useAccessRequestPolling } from '~/lib/auth/access-request'
import type { AccessRequest, AccessRequestStatus, OperatorSession } from '../types'
import { ApiError } from '~/lib/api/error'

export function useOperatorPortal() {
  const session = ref<OperatorSession | null>(null)
  const accessRequest = ref<AccessRequest | null>(null)
  const configured = ref(false)
  const busy = ref(false)
  const ready = ref(false)
  const error = ref('')
  const notice = ref('')
  const departing = ref(false)
  let disposed = false

  const isManager = computed(() => session.value?.accessSource === 'MANAGER')

  function announceDecision(status: AccessRequestStatus) {
    if (status === 'APPROVED') notice.value = '利用申請が承認されました。「運営を開始」からイベント運営を始めてください。'
    if (status === 'REJECTED') notice.value = '利用申請が却下されました。運営担当の管理者へご確認ください。'
    if (status === 'CANCELLED') notice.value = '利用申請が取り消されました。ログイン状態を確認してください。'
  }

  async function loadState() {
    let current: OperatorSession
    try {
      current = await operatorAuthApi.session()
    }
    catch (cause) {
      if (!(cause instanceof ApiError) || cause.statusCode !== 401) throw cause
      session.value = null
      accessRequest.value = null
      configured.value = (await operatorAuthApi.configuration()).configured
      ready.value = true
      return
    }
    session.value = current
    if (current.accessSource === 'APPLICANT') {
      const previousStatus = accessRequest.value?.status
      // 204 (no request yet) resolves to undefined.
      accessRequest.value = (await operatorAuthApi.ownRequest()) ?? null
      const decided = detectAccessRequestDecision(previousStatus, accessRequest.value?.status)
      if (decided) announceDecision(decided)
    }
    else {
      accessRequest.value = null
    }
    ready.value = true
  }

  async function run(action: () => Promise<void>) {
    if (busy.value || disposed) return
    busy.value = true
    error.value = ''
    try {
      await action()
    }
    catch (cause) {
      if (cause instanceof ApiError && cause.statusCode === 401) {
        session.value = null
        accessRequest.value = null
        ready.value = false
        notice.value = 'ログインの有効期限が切れました。もう一度 Google でログインしてください。'
        try {
          await loadState()
        }
        catch {
          error.value = '接続できませんでした。通信環境を確認して、再試行してください。'
        }
      }
      else if (cause instanceof ApiError && cause.statusCode === 403) {
        ready.value = false
        error.value = 'この操作に必要な権限を確認できませんでした。最新の状態を再確認してください。'
      }
      else if (cause instanceof ApiError && cause.statusCode === 409) {
        error.value = '申請の状態が変更されています。「最新の状態を確認」で更新してください。'
      }
      else {
        error.value = '接続できませんでした。通信環境を確認して、再試行してください。'
      }
    }
    finally {
      busy.value = false
    }
  }

  function refresh() {
    return run(() => loadState())
  }

  function apply() {
    return run(async () => {
      accessRequest.value = await operatorAuthApi.apply()
      notice.value = '利用申請を送信しました。運営担当の管理者へ承認を依頼してください。'
    })
  }

  function enter() {
    return run(async () => {
      await operatorAuthApi.exchange()
      ready.value = false
      await loadState()
      notice.value = 'オペレーターとして運営を開始しました。'
    })
  }

  function logout() {
    return run(async () => {
      await operatorAuthApi.logout()
      session.value = null
      accessRequest.value = null
      ready.value = false
      notice.value = 'ログアウトしました。'
      await loadState()
    })
  }

  function restoreNavigation() {
    departing.value = false
    void refresh()
  }

  onMounted(() => {
    void refresh()
    window.addEventListener('pageshow', restoreNavigation)
  })
  onUnmounted(() => {
    disposed = true
    window.removeEventListener('pageshow', restoreNavigation)
  })

  // Mirror the admin portal: poll every 10 seconds while an application is
  // pending, so an approval picked up here flips the screen automatically.
  useAccessRequestPolling({
    isActive: () => !!session.value
      && !busy.value
      && !error.value
      && !isManager.value
      && accessRequest.value?.status === 'PENDING',
    refresh,
  })

  return { session, accessRequest, configured, busy, ready, error, notice, departing, isManager, refresh, apply, enter, logout }
}
