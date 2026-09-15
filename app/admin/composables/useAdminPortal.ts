import { computed, onMounted, onUnmounted, ref } from 'vue'
import { adminAuthApi } from '../api/admin-auth'
import { useAccessRequestPolling } from '~/lib/auth/access-request'
import type {
  AccessRequest,
  AccessRequestDecision,
  AdminSession,
} from '../types'
import { ApiError } from '~/lib/api/error'

export function useAdminPortal() {
  const session = ref<AdminSession | null>(null)
  const accessRequest = ref<AccessRequest | null>(null)
  const pendingRequests = ref<AccessRequest[]>([])
  const pendingOperatorRequests = ref<AccessRequest[]>([])
  const configured = ref(false)
  const busy = ref(false)
  const ready = ref(false)
  const error = ref('')
  const notice = ref('')
  const departing = ref(false)
  let disposed = false

  const isManager = computed(() => !!session.value?.permissions.includes('MANAGEMENT_PAGE_VIEW'))
  const canApprove = computed(() => isManager.value && !!session.value?.permissions.includes('ACCESS_REQUEST_APPROVE'))
  const step = computed(() => isManager.value ? 3 : session.value ? 2 : 1)

  async function loadState() {
    let current: AdminSession
    try {
      current = await adminAuthApi.session()
    }
    catch (cause) {
      if (!(cause instanceof ApiError) || cause.statusCode !== 401) throw cause
      session.value = null
      accessRequest.value = null
      pendingRequests.value = []
      pendingOperatorRequests.value = []
      configured.value = (await adminAuthApi.configuration()).configured
      ready.value = true
      return
    }
    session.value = current
    if (current.accessSource === 'APPLICANT') {
      const previousStatus = accessRequest.value?.status
      accessRequest.value = (await adminAuthApi.ownRequest()) ?? null
      if (previousStatus === 'PENDING') {
        if (accessRequest.value?.status === 'APPROVED') notice.value = '利用申請が承認されました。「管理ポータルへ進む」から運営を開始できます。'
        if (accessRequest.value?.status === 'REJECTED') notice.value = '利用申請が却下されました。運営担当の管理者へご確認ください。'
        if (accessRequest.value?.status === 'CANCELLED') notice.value = '利用申請が取り消されました。ログイン状態を確認してください。'
      }
      pendingRequests.value = []
    }
    else {
      accessRequest.value = null
      pendingRequests.value = canApprove.value ? await adminAuthApi.pendingRequests() : []
      pendingOperatorRequests.value = canApprove.value ? await adminAuthApi.pendingOperatorRequests() : []
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
        pendingRequests.value = []
        pendingOperatorRequests.value = []
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
    return run(async () => {
      const hadSession = !!session.value
      await loadState()
      if (hadSession && !session.value) {
        notice.value = 'ログインの有効期限が切れました。もう一度 Google でログインしてください。'
      }
    })
  }

  function apply() {
    return run(async () => {
      accessRequest.value = await adminAuthApi.apply()
      notice.value = '利用申請を送信しました。運営担当の管理者へ承認を依頼してください。'
    })
  }

  function enter() {
    return run(async () => {
      await adminAuthApi.exchange()
      ready.value = false
      await loadState()
      notice.value = '管理者としてログインしました。'
    })
  }

  function logout() {
    return run(async () => {
      await adminAuthApi.logout()
      session.value = null
      accessRequest.value = null
      pendingRequests.value = []
      pendingOperatorRequests.value = []
      ready.value = false
      notice.value = 'ログアウトしました。'
      await loadState()
    })
  }

  function decide(id: number, decision: AccessRequestDecision) {
    return run(async () => {
      await adminAuthApi.decide(id, decision)
      pendingRequests.value = pendingRequests.value.filter(item => item.id !== id)
      notice.value = decision === 'approve' ? '申請を承認しました。申請者は同じブラウザから管理画面へ進めます。' : '申請を却下しました。'
    })
  }

  function decideOperatorRequest(id: number, decision: AccessRequestDecision) {
    return run(async () => {
      await adminAuthApi.decideOperatorRequest(id, decision)
      pendingOperatorRequests.value = pendingOperatorRequests.value.filter(item => item.id !== id)
      notice.value = decision === 'approve' ? 'オペレーターの申請を承認しました。申請者は同じブラウザからオペレーター画面へ進めます。' : 'オペレーターの申請を却下しました。'
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

  // Shared 10-second polling: keep pending applications (and near-expiry
  // sessions) up to date while the tab is visible.
  useAccessRequestPolling({
    isActive: () => !!session.value
      && !busy.value
      && !error.value
      && (accessRequest.value?.status === 'PENDING'
        || Date.parse(session.value.expiresAt) <= Date.now()),
    refresh,
  })

  return { session, accessRequest, pendingRequests, pendingOperatorRequests, configured, busy, ready, error, notice, departing, isManager, canApprove, step, refresh, apply, enter, logout, decide, decideOperatorRequest }
}
