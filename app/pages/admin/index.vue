<script setup lang="ts">
import type { AccessRequest, AdminSession, ManagementAccessEntry } from '~/features/admin-auth/types/admin'
import { createAccessRequest, deactivateAdmin, decideAccessRequest, exchangeApplicantSession, getAdminSession, getOwnAccessRequest, listAccessRequests, listAdmins, logoutAdmin } from '~/features/admin-auth/api/admin'
import { ApiError } from '~/lib/api/error'

const session = ref<AdminSession | null>(null)
const ownRequest = ref<AccessRequest | null>(null)
const pendingRequests = ref<AccessRequest[]>([])
const admins = ref<ManagementAccessEntry[]>([])
const isLoading = ref(true)
const isSaving = ref(false)
const errorMessage = ref('')
const successMessage = ref('')
let pollingTimer: number | undefined

const isApplicant = computed(() => session.value?.accessSource === 'APPLICANT')
const isAdmin = computed(() => session.value?.permissions.includes('MANAGEMENT_PAGE_VIEW') === true)
const canRevokeManagementAccess = computed(() => session.value?.permissions.includes('MANAGEMENT_ACCESS_REVOKE') === true)

async function loadAdminPage() {
  isLoading.value = true
  errorMessage.value = ''
  try {
    session.value = await getAdminSession()
    if (isApplicant.value) {
      ownRequest.value = await getOwnAccessRequest()
      startPolling()
    }
    else if (isAdmin.value) {
      pendingRequests.value = await listAccessRequests()
      admins.value = await listAdmins()
    }
  }
  catch (error) {
    if (error instanceof ApiError && error.statusCode === 401) {
      await navigateTo('/admin/login')
      return
    }
    errorMessage.value = '管理者情報を読み込めませんでした。'
  }
  finally {
    isLoading.value = false
  }
}

async function requestAccess() {
  if (!window.confirm('管理ページ利用を申請します。申請内容を確認して送信しますか？')) return
  isSaving.value = true
  errorMessage.value = ''
  try {
    ownRequest.value = await createAccessRequest()
    successMessage.value = '申請を受け付けました。承認されるまでこの画面でお待ちください。'
    startPolling()
  }
  catch (error) {
    errorMessage.value = error instanceof ApiError ? error.message : '申請を作成できませんでした。'
  }
  finally {
    isSaving.value = false
  }
}

function startPolling() {
  if (pollingTimer !== undefined) return
  pollingTimer = window.setInterval(checkOwnRequest, 3000)
}

async function checkOwnRequest() {
  if (!isApplicant.value) return
  try {
    ownRequest.value = await getOwnAccessRequest()
    if (ownRequest.value?.status === 'APPROVED') {
      await exchangeApplicantSession()
      stopPolling()
      await navigateTo('/admin', { replace: true })
    }
    else if (ownRequest.value?.status === 'REJECTED' || ownRequest.value?.status === 'CANCELLED') {
      stopPolling()
    }
  }
  catch {
    // 一時的な通信失敗では申請状態を消さず、次のポーリングで再試行する。
  }
}

function stopPolling() {
  if (pollingTimer !== undefined) {
    window.clearInterval(pollingTimer)
    pollingTimer = undefined
  }
}

async function decide(request: AccessRequest, decision: 'approve' | 'reject') {
  const label = decision === 'approve' ? '承認' : '却下'
  if (!window.confirm(`${request.email} の申請を${label}しますか？`)) return
  errorMessage.value = ''
  successMessage.value = ''
  try {
    await decideAccessRequest(request.id, decision)
    pendingRequests.value = pendingRequests.value.filter(item => item.id !== request.id)
    successMessage.value = `申請を${label}しました。`
  }
  catch (error) {
    if (error instanceof ApiError && error.statusCode === 409) {
      pendingRequests.value = pendingRequests.value.filter(item => item.id !== request.id)
      errorMessage.value = '申請の有効期限が切れたか、取り消されています。一覧から除外しました。'
    }
    else {
      errorMessage.value = error instanceof ApiError ? error.message : `申請を${label}できませんでした。`
    }
  }
}

async function deactivate(entry: ManagementAccessEntry) {
  if (entry.id === null || !window.confirm(`${entry.email} を無効化しますか？対象セッションも即時失効します。`)) return
  errorMessage.value = ''
  successMessage.value = ''
  try {
    await deactivateAdmin(entry.id)
    entry.active = false
    successMessage.value = '管理ページ利用を解除しました。対象セッションも失効しています。'
  }
  catch (error) {
    errorMessage.value = error instanceof ApiError ? error.message : '管理ページ利用を解除できませんでした。'
  }
}

async function logout() {
  await logoutAdmin()
  await navigateTo('/admin/login')
}

onMounted(loadAdminPage)
onUnmounted(stopPolling)
</script>

<template>
  <main class="admin-page">
    <header class="admin-page__header">
      <div>
        <p class="eyebrow">Administrator console</p>
        <h1>{{ isApplicant ? '管理ページ利用申請' : '管理ページ設定' }}</h1>
        <p v-if="session" class="muted-copy">{{ session.email }} · {{ session.accessSource === 'ENVIRONMENT_ACCESS' ? '環境設定者' : session.accessSource === 'MANAGEMENT_ACCESS' ? '管理ページ利用者' : '申請者' }}</p>
      </div>
      <button class="secondary-button" type="button" @click="logout">ログアウト</button>
    </header>

    <p v-if="errorMessage" class="status-message error" role="alert">{{ errorMessage }}</p>
    <p v-if="successMessage" class="status-message success" role="status">{{ successMessage }}</p>
    <p v-if="isLoading" class="muted-copy">読み込み中です…</p>

    <template v-else-if="isApplicant">
      <section class="admin-panel applicant-panel" aria-labelledby="applicant-title">
        <p class="eyebrow">Applicant access</p>
        <h2 id="applicant-title">管理ページ利用を申請</h2>
        <p class="muted-copy">Google本人確認済みです。管理ページ利用の承認後、管理画面へ自動的に切り替わります。</p>
        <button v-if="!ownRequest" class="primary-link" type="button" :disabled="isSaving" @click="requestAccess">管理ページ利用を申請</button>
        <div v-else class="request-status" :class="`request-status--${ownRequest.status.toLowerCase()}`" role="status">
          <strong v-if="ownRequest.status === 'PENDING'">承認待ちです</strong>
          <strong v-else-if="ownRequest.status === 'APPROVED'">承認されました。管理画面へ移動しています…</strong>
          <strong v-else-if="ownRequest.status === 'REJECTED'">申請は却下されました</strong>
          <strong v-else>申請は取り消されました</strong>
          <span v-if="ownRequest.status === 'PENDING'">数秒ごとに承認状況を確認しています。</span>
          <span v-else-if="ownRequest.status === 'CANCELLED'">一時セッションの期限切れまたはログアウトにより申請を取り消しました。再ログインして新しく申請してください。</span>
        </div>
      </section>
    </template>

    <template v-else-if="isAdmin">
      <section class="admin-panel" aria-labelledby="requests-title">
        <div class="admin-panel__heading">
          <div><p class="eyebrow">Approval queue</p><h2 id="requests-title">承認待ち申請</h2></div>
          <span class="admin-panel__hint">B/Cのどちらか一人が承認または却下</span>
        </div>
        <ul class="admin-email-list">
          <li v-for="item in pendingRequests" :key="item.id" class="admin-email-list__item">
            <div><strong>{{ item.email }}</strong><small>申請日時: {{ new Date(item.createdAt).toLocaleString('ja-JP') }}</small></div>
            <div class="admin-action-group"><button class="primary-link" type="button" @click="decide(item, 'approve')">承認</button><button class="danger-button" type="button" @click="decide(item, 'reject')">却下</button></div>
          </li>
          <li v-if="pendingRequests.length === 0" class="muted-copy">承認待ちの申請はありません。</li>
        </ul>
      </section>

      <section class="admin-panel" aria-labelledby="allowlist-title">
        <div class="admin-panel__heading"><div><p class="eyebrow">Access control</p><h2 id="allowlist-title">管理ページ利用者一覧</h2></div><span class="admin-panel__hint">環境設定者の利用許可は変更できません</span></div>
        <ul class="admin-email-list">
          <li v-for="entry in admins" :key="`${entry.source}-${entry.id ?? entry.email}`" class="admin-email-list__item" :class="{ 'is-inactive': !entry.active }">
            <div><strong>{{ entry.email }}</strong><small>{{ entry.source === 'ENVIRONMENT_ACCESS' ? '環境設定者' : '管理ページ利用者' }} · {{ entry.active ? '有効' : '無効' }}</small></div>
            <button v-if="canRevokeManagementAccess && entry.source === 'MANAGEMENT_ACCESS' && entry.active" class="danger-button" type="button" @click="deactivate(entry)">無効化</button>
            <span v-else-if="entry.source === 'ENVIRONMENT_ACCESS'" class="admin-email-list__protected">環境変数で管理</span>
          </li>
          <li v-if="admins.length === 0" class="muted-copy">管理ページ利用者はまだ登録されていません。</li>
        </ul>
      </section>
    </template>
  </main>
</template>
