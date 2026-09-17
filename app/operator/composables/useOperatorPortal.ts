import { computed, onMounted, onUnmounted, ref } from 'vue'
import { operatorAuthApi } from '../api/operator-auth'
import type { OperatorSession } from '../types'
import { ApiError } from '~/lib/api/error'

export function useOperatorPortal() {
  const session = ref<OperatorSession | null>(null)
  const configured = ref(false)
  const busy = ref(false)
  const ready = ref(false)
  const error = ref('')
  const notice = ref('')
  const departing = ref(false)
  let disposed = false

  const isManager = computed(() => session.value?.accessSource === 'MANAGER')

  async function loadState() {
    try {
      session.value = await operatorAuthApi.session()
    }
    catch (cause) {
      if (!(cause instanceof ApiError) || cause.statusCode !== 401) throw cause
      session.value = null
      configured.value = (await operatorAuthApi.configuration()).configured
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
      else error.value = '接続できませんでした。通信環境を確認して、再試行してください。'
    }
    finally {
      busy.value = false
    }
  }

  function refresh() {
    return run(() => loadState())
  }

  function logout() {
    return run(async () => {
      await operatorAuthApi.logout()
      session.value = null
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

  return { session, configured, busy, ready, error, notice, departing, isManager, refresh, logout }
}
