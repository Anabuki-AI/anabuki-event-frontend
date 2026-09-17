import { onUnmounted, ref } from 'vue'
import { adminConsoleApi, type ManagementAccount, type OperatorAccount } from '../api/admin-console'
import { parseMonitoringSnapshot, unconfiguredMonitoring } from '../monitoring-contract'
import { ApiError } from '~/lib/api/error'

export interface HealthObservation {
  available: boolean
  elapsedMs: number
  checkedAt: string
}

// Independent resources: a failed probe must never hide an otherwise valid session.
// No timers or fabricated metrics; every observation comes from a deliberate fetch.
export function useAdminConsoleData(onAccessLost: () => Promise<void>, monitoringEnabled = false) {
  const monitoring = ref(unconfiguredMonitoring())
  const monitoringLoading = ref(false)
  const monitoringError = ref('')
  const accounts = ref<ManagementAccount[]>([])
  const accountsLoading = ref(false)
  const accountsLoaded = ref(false)
  const accountsError = ref('')
  const operatorAccounts = ref<OperatorAccount[]>([])
  const operatorAccountsLoading = ref(false)
  const operatorAccountsLoaded = ref(false)
  const operatorAccountsError = ref('')
  const health = ref<HealthObservation | null>(null)
  const healthLoading = ref(false)
  const healthError = ref('')
  let disposed = false
  onUnmounted(() => { disposed = true })

  async function loadAccounts() {
    if (accountsLoading.value || disposed) return
    accountsLoading.value = true
    accountsError.value = ''
    accountsLoaded.value = false
    accounts.value = []
    try {
      const result = await adminConsoleApi.accounts()
      if (disposed) return
      accounts.value = result
      accountsLoaded.value = true
    }
    catch (cause) {
      if (disposed) return
      if (cause instanceof ApiError && [401, 403].includes(cause.statusCode ?? 0)) {
        accountsError.value = '一覧を表示する権限、またはログインの有効期限を確認できません。'
        await onAccessLost()
      }
      else accountsError.value = 'ユーザー一覧を取得できませんでした。接続を確認して再試行してください。'
    }
    finally {
      if (!disposed) accountsLoading.value = false
    }
  }

  async function loadOperatorAccounts() {
    if (operatorAccountsLoading.value || disposed) return
    operatorAccountsLoading.value = true
    operatorAccountsError.value = ''
    operatorAccountsLoaded.value = false
    operatorAccounts.value = []
    try {
      operatorAccounts.value = await adminConsoleApi.operatorAccounts()
      if (!disposed) operatorAccountsLoaded.value = true
    }
    catch (cause) {
      if (disposed) return
      if (cause instanceof ApiError && [401, 403].includes(cause.statusCode ?? 0)) {
        operatorAccountsError.value = 'オペレーター一覧を表示する権限、またはログインの有効期限を確認できません。'
        await onAccessLost()
      }
      else operatorAccountsError.value = 'オペレーター一覧を取得できませんでした。接続を確認して再試行してください。'
    }
    finally {
      if (!disposed) operatorAccountsLoading.value = false
    }
  }

  async function setOperatorAccess(id: string, managerEnabled: boolean) {
    if (operatorAccountsLoading.value || disposed) return
    operatorAccountsLoading.value = true
    operatorAccountsError.value = ''
    try {
      const account = await adminConsoleApi.setOperatorAccess(id, managerEnabled)
      if (!disposed) operatorAccounts.value = operatorAccounts.value.map(item => item.id === id ? account : item)
    }
    catch (cause) {
      if (disposed) return
      if (cause instanceof ApiError && [401, 403].includes(cause.statusCode ?? 0)) {
        operatorAccountsError.value = 'オペレーター権限を変更する権限、またはログインの有効期限を確認できません。'
        await onAccessLost()
      }
      else operatorAccountsError.value = 'オペレーター権限を変更できませんでした。接続を確認して再試行してください。'
    }
    finally {
      if (!disposed) operatorAccountsLoading.value = false
    }
  }

  async function checkHealth() {
    if (healthLoading.value || disposed) return
    healthLoading.value = true
    healthError.value = ''
    health.value = null
    const started = performance.now()
    try {
      const response = await adminConsoleApi.health()
      if (disposed) return
      health.value = { available: response.status === 'ok', elapsedMs: Math.round(performance.now() - started), checkedAt: new Date().toISOString() }
    }
    catch {
      if (!disposed) healthError.value = '疎通を確認できませんでした。ネットワークまたはバックエンドの状態を確認してください。'
    }
    finally {
      if (!disposed) healthLoading.value = false
    }
  }

  async function loadMonitoring() {
    if (!monitoringEnabled || monitoringLoading.value || disposed) return
    monitoringLoading.value = true
    monitoringError.value = ''
    // Never present a previous successful observation as current while refreshing.
    monitoring.value = unconfiguredMonitoring()
    try {
      const result = parseMonitoringSnapshot(await adminConsoleApi.monitoring())
      if (!disposed) monitoring.value = result
    }
    catch (cause) {
      if (disposed) return
      if (cause instanceof ApiError && cause.statusCode === 401) {
        monitoringError.value = 'ログインの有効期限を確認できません。再ログインしてください。'
        await onAccessLost()
      }
      else if (cause instanceof ApiError && cause.statusCode === 403) {
        monitoringError.value = '外部監視データを表示する権限がありません。管理担当者へ確認してください。'
      }
      else monitoringError.value = '外部監視データを取得できませんでした。サービスの稼働状況は判断できません。'
    }
    finally {
      if (!disposed) monitoringLoading.value = false
    }
  }

  return { accounts, accountsLoading, accountsLoaded, accountsError, operatorAccounts, operatorAccountsLoading, operatorAccountsLoaded, operatorAccountsError, health, healthLoading, healthError, monitoring, monitoringLoading, monitoringError, loadAccounts, loadOperatorAccounts, setOperatorAccess, checkHealth, loadMonitoring }
}
