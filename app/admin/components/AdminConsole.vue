<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import type { AccessRequest, AdminSession } from '../api/admin-auth'
import type { ManagementAccount, OperatorAccount } from '../api/admin-console'
import { accessSourceLabel, consolePages, formatConsoleDate, getConsolePage } from '../console-presentation'
import { useAdminConsoleData } from '../composables/useAdminConsoleData'
import MonitoringPanel from './MonitoringPanel.vue'

const props = defineProps<{
  session: AdminSession
  pendingRequests: AccessRequest[]
  busy: boolean
  canApprove: boolean
  error: string
  notice: string
  refresh: () => Promise<void>
  logout: () => Promise<void>
  decide: (id: number, decision: 'approve' | 'reject') => Promise<void>
}>()
const route = useRoute()
const config = useRuntimeConfig()
const monitoringEnabled = String(config.public.adminMonitoringEnabled) === 'true'
const page = computed(() => getConsolePage(route.path))
const heading = ref<HTMLElement | null>(null)
const dialog = ref<HTMLDialogElement | null>(null)
const decision = ref<{ request: AccessRequest, action: 'approve' | 'reject' } | null>(null)
const operatorChange = ref<OperatorAccount | null>(null)
const emailDelete = ref<ManagementAccount | null>(null)
const permissionTab = ref<'admin' | 'operator'>('admin')
const pendingRequestCount = computed(() => props.pendingRequests.length)
const permissionTabs = [ 'admin', 'operator' ] as const
onMounted(() => heading.value?.focus({ preventScroll: true }))
const {
  accounts, accountsLoading, accountsLoaded, accountsError, accountRemoving,
  operatorAccounts, operatorAccountsLoading, operatorAccountsLoaded, operatorAccountsError,
  health, healthLoading, healthError, monitoring, monitoringLoading, monitoringError,
  loadAccounts, loadOperatorAccounts, setOperatorAccess, removeAccount, checkHealth, loadMonitoring,
} = useAdminConsoleData(props.refresh, monitoringEnabled)

useHead({ title: computed(() => page.value.label) })

watch(() => page.value.key, async (key, previous) => {
  if (key === 'permissions') {
    void loadAccounts()
    void loadOperatorAccounts()
  }
  if (key === 'status') void loadMonitoring()
  if (previous) {
    await nextTick()
    heading.value?.focus()
  }
}, { immediate: true })

function selectPermissionTab(tab: 'admin' | 'operator') {
  permissionTab.value = tab
}
function handlePermissionTabKeydown(event: KeyboardEvent, tab: 'admin' | 'operator') {
  const currentIndex = permissionTabs.indexOf(tab)
  const nextIndex = event.key === 'ArrowRight' || event.key === 'ArrowDown' ? (currentIndex + 1) % permissionTabs.length
    : event.key === 'ArrowLeft' || event.key === 'ArrowUp' ? (currentIndex + permissionTabs.length - 1) % permissionTabs.length
      : event.key === 'Home' ? 0 : event.key === 'End' ? permissionTabs.length - 1 : -1
  if (nextIndex < 0) return

  event.preventDefault()
  const nextTab = permissionTabs[nextIndex]!
  selectPermissionTab(nextTab)
  document.getElementById(`permission-tab-${nextTab}`)?.focus()
}
async function openDecision(request: AccessRequest, action: 'approve' | 'reject') {
  decision.value = { request, action }
  // Render the autofocus target before native dialog focus management runs.
  await nextTick()
  dialog.value?.showModal()
}
async function openOperatorAccessConfirmation(account: OperatorAccount) {
  operatorChange.value = account
  await nextTick()
  dialog.value?.showModal()
}
async function openEmailDeletionConfirmation(account: ManagementAccount) {
  emailDelete.value = account
  await nextTick()
  dialog.value?.showModal()
}
async function confirmEmailDeletion() {
  const account = emailDelete.value
  const id = account?.id
  if (!account || id === undefined || id === null || accountRemoving.value) return
  dialog.value?.close()
  emailDelete.value = null
  await removeAccount(id)
}
function keepDialogFocus(event: KeyboardEvent) {
  if (event.key !== 'Tab') return
  const controls = dialog.value?.querySelectorAll<HTMLButtonElement>('button:not(:disabled)')
  const first = controls?.[0]
  const last = controls?.[controls.length - 1]
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault()
    last?.focus()
  }
  else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault()
    first?.focus()
  }
}
async function confirmDecision() {
  if (!decision.value || props.busy) return
  const { request, action } = decision.value
  dialog.value?.close()
  decision.value = null
  await props.decide(request.id, action)
  await loadAccounts()
  await nextTick()
  heading.value?.focus({ preventScroll: true })
}
async function confirmOperatorAccessRemoval() {
  if (!operatorChange.value || operatorAccountsLoading.value) return
  const account = operatorChange.value
  dialog.value?.close()
  operatorChange.value = null
  await setOperatorAccess(account.id, false)
}
async function refreshTeam() {
  await Promise.all([props.refresh(), loadAccounts(), loadOperatorAccounts()])
}
</script>

<template>
  <div class="admin-console">
    <a href="#console-content" class="console-skip">メインコンテンツへ移動</a>
    <aside class="console-sidebar">
      <NuxtLink to="/admin" class="console-brand" aria-label="Anabuki Event 管理者メイン">
        <span class="brand-grid" aria-hidden="true"><i /><i /><i /><i /></span>
        <span>ANABUKI<small>EVENT ADMIN</small></span>
      </NuxtLink>
      <p class="nav-caption">ワークスペース</p>
      <nav aria-label="管理者メニュー" class="console-nav">
        <NuxtLink v-for="item in consolePages" :key="item.key" :to="item.path" :class="{ selected: page.key === item.key }" :aria-current="page.key === item.key ? 'page' : undefined">
          <PortalIcon :name="item.icon" /><span>{{ item.label }}</span><span v-if="item.key === 'permissions' && canApprove && pendingRequestCount" class="nav-count" :aria-label="`${pendingRequestCount}件の承認待ち`">{{ pendingRequestCount }}</span>
        </NuxtLink>
      </nav>
      <div class="sidebar-note"><span class="note-rule" /><p>いい大会は、<br >いい準備から。</p><small>穴吹ITビジネスカレッジ<br >AIテクノロジー学科</small></div>
      <NuxtLink to="/admin/logout" class="sidebar-account"><span class="avatar" aria-hidden="true">{{ session.email[0]?.toUpperCase() }}</span><span><small>ログイン中</small><strong>{{ session.email }}</strong></span><PortalIcon name="logout" /></NuxtLink>
    </aside>

    <div class="console-workspace">
      <header class="console-topbar"><span><PortalIcon name="lock" />管理者コンソール</span><NuxtLink to="/">参加者トップへ <PortalIcon name="arrow" /></NuxtLink></header>
      <main id="console-content" class="console-main" tabindex="-1">
        <div class="page-heading"><p class="kicker">{{ page.eyebrow }}</p><h1 ref="heading" tabindex="-1">{{ page.title }}</h1><p>{{ page.description }}</p></div>
        <div v-if="notice" class="feedback success" role="status">{{ notice }}</div>
        <div v-if="error" class="feedback error" role="alert"><p>{{ error }}</p><button class="button secondary" :disabled="busy" @click="refresh">最新の状態を確認</button></div>

        <template v-if="page.key === 'home'">
          <section class="welcome-card" aria-labelledby="welcome-title">
            <div class="welcome-copy"><span class="badge positive"><PortalIcon name="check" />管理アクセス確認済み</span><h2 id="welcome-title">今日の運営を、ここから。</h2><p>必要な情報へ、迷わずアクセス。<br >チームの確認からはじめましょう。</p><NuxtLink to="/admin/permissions" class="button primary">チームと利用申請を確認 <PortalIcon name="arrow" /></NuxtLink></div>
            <div class="welcome-art" aria-hidden="true"><span class="art-orbit" /><span class="art-tile tile-back"><PortalIcon name="users" /></span><span class="art-tile tile-front"><PortalIcon name="check" /><i /><i /></span><span class="art-dot" /></div>
          </section>
          <div class="overview-grid">
            <section class="surface overview-account"><div class="section-heading"><h2>ログイン中のアカウント</h2><PortalIcon name="lock" /></div><div class="identity-row"><span class="avatar large" aria-hidden="true">{{ session.email[0]?.toUpperCase() }}</span><div><strong>{{ session.email }}</strong><p>管理ページの閲覧権限あり</p></div></div><dl class="detail-list"><div><dt>アクセスの付与方法</dt><dd>{{ session.accessSource === 'ENVIRONMENT_ACCESS' ? '環境設定' : '利用申請の承認' }}</dd></div><div><dt>セッション有効期限</dt><dd>{{ formatConsoleDate(session.expiresAt) }}（日本時間）</dd></div></dl></section>
            <section class="surface request-summary"><div class="section-heading"><h2>チームの利用申請</h2><PortalIcon name="users" /></div><template v-if="canApprove"><p class="request-total"><strong>{{ pendingRequests.length }}</strong><span>件の承認待ち</span></p><NuxtLink to="/admin/permissions" class="text-link">利用申請を確認する <PortalIcon name="arrow" /></NuxtLink><p class="footnote">現在取得済みの申請数です。</p></template><p v-else class="empty-inline">利用申請を確認する権限がありません。</p></section>
          </div>
          <div class="section-heading destinations-heading"><h2>管理メニュー</h2><span class="subtle">目的に合わせて選択</span></div>
          <div class="destination-grid"><NuxtLink v-for="item in consolePages.slice(1, 4)" :key="item.key" :to="item.path" class="destination-card"><span class="destination-icon" :class="item.key"><PortalIcon :name="item.icon" /></span><h3>{{ item.label }}</h3><p>{{ item.key === 'logs' ? '操作・エラーの記録を確認。監査ログの連携状況を表示します。' : item.key === 'status' ? '外部監視の稼働情報と、バックエンドへの疎通を確認します。' : 'アカウントのアクセス状況と、チームからの申請を確認します。' }}</p><span class="destination-action">画面を開く <PortalIcon name="arrow" /></span></NuxtLink></div>
        </template>

        <template v-else-if="page.key === 'logs'">
          <section class="surface" aria-labelledby="log-title"><div class="section-heading"><div><p class="kicker">AUDIT TRAIL</p><h2 id="log-title">操作・エラーログ</h2></div><span class="badge neutral">データ未連携</span></div><div class="table-scroll" role="region" aria-labelledby="log-title" tabindex="0"><table><caption class="sr-only">監査ログの表示項目。現在はデータ未連携です。</caption><thead><tr><th scope="col">操作内容</th><th scope="col">実行ユーザー</th><th scope="col">日時（日本時間）</th></tr></thead><tbody><tr><td colspan="3"><div class="empty-state"><span class="empty-illustration"><PortalIcon name="logs" /></span><h3>記録をつなぐ準備をしています</h3><p>監査ログAPIはまだ連携されていません。<br >「操作履歴なし」や「エラー0件」を意味するものではありません。</p></div></td></tr></tbody></table></div></section>
          <section class="integration-note"><PortalIcon name="info" /><div><h2>連携後に確認できること</h2><p>操作の内容、実行アカウント、発生日時を一覧で確認します。ログの保存・検索・閲覧権限はバックエンド連携で対応予定です。現在、ブラウザ内に監査履歴を保存することはありません。</p></div></section>
        </template>

        <template v-else-if="page.key === 'status'">
          <MonitoringPanel :snapshot="monitoring" :loading="monitoringLoading" :error="monitoringError" :enabled="monitoringEnabled" @refresh="loadMonitoring" />
          <section class="surface probe-section" aria-labelledby="probe-title" :aria-busy="healthLoading"><div class="section-heading"><div><p class="kicker">LOCAL CONNECTIVITY</p><h2 id="probe-title">このブラウザからの疎通確認</h2></div><button class="button secondary" :disabled="healthLoading" @click="checkHealth"><PortalIcon name="refresh" />{{ healthLoading ? '確認中…' : '疎通を確認' }}</button></div><p class="section-description">フロントエンドのプロキシを経由し、Rails の /health に接続します。</p><div v-if="healthError" class="feedback error" role="alert">{{ healthError }}</div><div class="probe-grid" aria-live="polite"><div><span>今回の確認結果</span><strong>{{ healthLoading ? '確認中' : health ? health.available ? '疎通成功' : '応答内容を確認できません' : healthError ? '確認できません' : '未確認' }}</strong></div><div><span>ブラウザ往復時間</span><strong>{{ health ? `${health.elapsedMs} ms` : '未計測' }}</strong></div><div><span>確認時刻（日本時間）</span><strong>{{ health ? formatConsoleDate(health.checkedAt) : '未確認' }}</strong></div></div><p class="footnote">単発の疎通結果です。DB・外部サービスの正常性、全APIの稼働率、サーバー処理時間を示すものではありません。</p></section>
        </template>

        <template v-else-if="page.key === 'permissions'">
          <div class="permission-tabs" role="tablist" aria-label="権限の種類">
            <button id="permission-tab-admin" role="tab" aria-controls="permission-panel-admin" :aria-selected="permissionTab === 'admin'" tabindex="0" @click="selectPermissionTab('admin')" @keydown="handlePermissionTabKeydown($event, 'admin')">管理者</button>
            <button id="permission-tab-operator" role="tab" aria-controls="permission-panel-operator" :aria-selected="permissionTab === 'operator'" tabindex="0" @click="selectPermissionTab('operator')" @keydown="handlePermissionTabKeydown($event, 'operator')">オペレーター</button>
          </div>

          <div v-if="permissionTab === 'admin'" id="permission-panel-admin" role="tabpanel" aria-labelledby="permission-tab-admin" tabindex="0">
            <section class="surface" aria-labelledby="accounts-title" :aria-busy="accountsLoading">
              <div class="section-heading"><div><p class="kicker">ADMINISTRATOR ACCESS</p><h2 id="accounts-title">管理者一覧</h2></div><button class="button secondary" :disabled="accountsLoading || busy" @click="refreshTeam"><PortalIcon name="refresh" />{{ accountsLoading ? '更新中…' : '一覧を更新' }}</button></div>
              <p class="section-description">管理アクセスが付与された、または取り消されたアカウントです。</p>
              <div v-if="accountsError" class="feedback error" role="alert">{{ accountsError }}</div><p v-else-if="accountsLoading" class="empty-inline" role="status">管理者一覧を取得しています…</p>
              <div v-else-if="accountsLoaded" class="table-scroll" role="region" aria-labelledby="accounts-title" tabindex="0"><table><caption class="sr-only">管理アクセスを持つアカウント</caption><thead><tr><th scope="col">ユーザー</th><th scope="col">アクセス</th><th scope="col">付与方法</th><th scope="col">操作</th></tr></thead><tbody><tr v-for="account in accounts" :key="account.id ?? account.email"><td><span class="table-email">{{ account.email }}</span><small v-if="account.email === session.email" class="self-label">あなた</small></td><td><span class="badge" :class="account.active ? 'positive' : 'neutral'">{{ account.active ? '有効' : '取消済み' }}</span></td><td>{{ accessSourceLabel(account.source) }}</td><td><button class="button secondary" :disabled="accountRemoving || account.id === null" :aria-label="`${account.email} の許可メールを削除`" @click="openEmailDeletionConfirmation(account)">削除</button></td></tr><tr v-if="!accounts.length"><td colspan="4" class="empty-inline">表示できる管理アクセスはありません。</td></tr></tbody></table></div>
            </section>
            <section class="surface approval-section" aria-labelledby="requests-title" :aria-busy="busy"><div class="section-heading"><div><p class="kicker">ADMIN ACCESS REQUESTS</p><h2 id="requests-title">管理者の利用申請 <span v-if="canApprove" class="inline-count">{{ pendingRequests.length }}</span></h2></div></div><p class="section-description">申請者本人と確認してから承認してください。承認すると管理アクセスが付与されます。</p><p v-if="!canApprove" class="empty-inline">申請を承認・却下する権限がありません。</p><div v-else-if="!pendingRequests.length" class="empty-state compact"><span class="empty-illustration"><PortalIcon name="check" /></span><h3>承認待ちの申請はありません</h3><p>新しい申請は「一覧を更新」から確認できます。</p></div><ul v-else class="approval-list"><li v-for="request in pendingRequests" :key="request.id"><div class="identity-row"><span class="avatar" aria-hidden="true">{{ request.email[0]?.toUpperCase() }}</span><div><strong>{{ request.email }}</strong><p>申請 #{{ request.id }} · {{ formatConsoleDate(request.expiresAt) }} まで（日本時間）</p></div></div><div class="approval-actions"><button class="button secondary" :disabled="busy" :aria-label="`${request.email} の申請を却下`" @click="openDecision(request, 'reject')">却下</button><button class="button primary" :disabled="busy" :aria-label="`${request.email} の申請を承認`" @click="openDecision(request, 'approve')">承認する</button></div></li></ul></section>
          </div>

          <div v-else id="permission-panel-operator" role="tabpanel" aria-labelledby="permission-tab-operator" tabindex="0">
            <section class="surface" aria-labelledby="operator-accounts-title" :aria-busy="operatorAccountsLoading">
              <div class="section-heading"><div><p class="kicker">OPERATOR ACCESS</p><h2 id="operator-accounts-title">オペレーター一覧</h2></div><button class="button secondary" :disabled="operatorAccountsLoading || busy" @click="loadOperatorAccounts"><PortalIcon name="refresh" />{{ operatorAccountsLoading ? '更新中…' : '一覧を更新' }}</button></div>
              <p class="section-description">Google ログイン済みのユーザーを選び、オペレーター権限を直接付与・解除できます。</p>
              <div v-if="operatorAccountsError" class="feedback error" role="alert">{{ operatorAccountsError }}</div><p v-else-if="operatorAccountsLoading && !operatorAccountsLoaded" class="empty-inline" role="status">オペレーター一覧を取得しています…</p>
              <div v-else-if="operatorAccountsLoaded" class="table-scroll" role="region" aria-labelledby="operator-accounts-title" tabindex="0"><table><caption class="sr-only">Google ログイン済みオペレーターの権限一覧</caption><thead><tr><th scope="col">ユーザー</th><th scope="col">オペレーター権限</th><th scope="col">付与方法</th><th scope="col">操作</th></tr></thead><tbody><tr v-for="account in operatorAccounts" :key="account.id"><td><span class="table-email">{{ account.email }}</span></td><td><span class="badge" :class="account.active ? 'positive' : 'neutral'">{{ account.active ? '有効' : '未付与' }}</span></td><td>{{ accessSourceLabel(account.source) }}</td><td><button class="button secondary" :disabled="operatorAccountsLoading || account.source === 'ENVIRONMENT_ACCESS'" :aria-label="`${account.email} のオペレーター権限を${account.managerEnabled ? '解除' : '付与'}`" @click="account.managerEnabled ? openOperatorAccessConfirmation(account) : setOperatorAccess(account.id, true)">{{ account.managerEnabled ? '解除する' : '付与する' }}</button></td></tr><tr v-if="!operatorAccounts.length"><td colspan="4" class="empty-inline">Google ログイン済みのオペレーターはいません。</td></tr></tbody></table></div>
            </section>
            <section class="integration-note"><PortalIcon name="info" /><div><h2>オペレーター権限について</h2><p>対象者は先にオペレーターポータルで Google ログインを完了している必要があります。申請の承認は不要です。解除すると、環境設定による権限を除き、対象者のオペレーターセッションは終了します。</p></div></section>
          </div>
        </template>

        <section v-else-if="page.key === 'logout'" class="surface logout-surface" aria-labelledby="signout-title"><span class="empty-illustration"><PortalIcon name="logout" /></span><h2 id="signout-title">このアカウントからログアウトしますか？</h2><p class="section-description">このブラウザの管理セッションを終了します。<br >再び利用する場合は、Google でログインしてください。</p><div class="identity-row logout-identity"><span class="avatar large" aria-hidden="true">{{ session.email[0]?.toUpperCase() }}</span><div><span class="subtle">ログイン中のユーザー</span><strong>{{ session.email }}</strong></div></div><p class="footnote">表示名はAPIから提供されないため、メールアドレスを表示しています。</p><div class="logout-actions"><NuxtLink to="/admin" class="button secondary">管理者メインに戻る</NuxtLink><button class="button primary" :disabled="busy" @click="logout"><PortalIcon name="logout" />{{ busy ? 'ログアウトしています…' : '確認してログアウト' }}</button></div></section>
      </main>
      <footer class="console-footer"><span>ANABUKI EVENT · ADMIN WORKSPACE</span><span>管理機能はPCでの利用を推奨しています。</span></footer>
    </div>

    <dialog ref="dialog" class="console-dialog" aria-labelledby="console-decision-title" @close="decision = null; operatorChange = null; emailDelete = null" @keydown="keepDialogFocus">
      <template v-if="decision"><p class="kicker">CONFIRM ACCESS</p><h2 id="console-decision-title">この申請を{{ decision.action === 'approve' ? '承認' : '却下' }}しますか？</h2><p class="dialog-account">{{ decision.request.email }}</p><p>{{ decision.action === 'approve' ? '承認すると、申請者は同じブラウザから管理画面へ進めます。' : '却下後も、申請者は必要に応じて再申請できます。' }}</p><div class="logout-actions"><button class="button secondary" autofocus @click="dialog?.close()">戻る</button><button class="button primary" :disabled="busy" @click="confirmDecision">{{ decision.action === 'approve' ? '承認する' : '却下する' }}</button></div></template>
      <template v-else-if="operatorChange"><p class="kicker">CONFIRM OPERATOR ACCESS</p><h2 id="console-decision-title">オペレーター権限を解除しますか？</h2><p class="dialog-account">{{ operatorChange.email }}</p><p>解除すると、環境設定による権限を除き、このユーザーのオペレーターセッションは終了します。</p><div class="logout-actions"><button class="button secondary" autofocus @click="dialog?.close()">戻る</button><button class="button primary" :disabled="operatorAccountsLoading" @click="confirmOperatorAccessRemoval">解除する</button></div></template>
      <template v-else-if="emailDelete"><p class="kicker">CONFIRM EMAIL REMOVAL</p><h2 id="console-decision-title">許可メールを削除しますか？</h2><p class="dialog-account">{{ emailDelete.email }}</p><p>削除すると、このメールアドレスは管理画面へアクセスできなくなります。対象者がログイン中の場合、セッションは無効になります。</p><div class="logout-actions"><button class="button secondary" autofocus @click="dialog?.close()">戻る</button><button class="button primary" :disabled="accountRemoving" @click="confirmEmailDeletion">{{ accountRemoving ? '削除中…' : '削除する' }}</button></div></template>
    </dialog>
  </div>
</template>

<style src="../styles/admin-console.css" />
