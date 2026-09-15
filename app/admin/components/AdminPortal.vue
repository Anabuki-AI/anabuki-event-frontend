<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'
import {
  adminWorkflowSteps,
  formatAdminDate,
  getAccessRequestStateCopy,
} from '../portal-presentation'
import { useAdminPortal } from '../composables/useAdminPortal'
import { buildGoogleStartUrl, isGoogleAuthError } from '~/lib/auth/google'
import type { AccessRequestDecision } from '../types'

const {
  session,
  accessRequest,
  pendingRequests,
  pendingOperatorRequests,
  configured,
  busy,
  ready,
  error,
  notice,
  departing,
  isManager,
  canApprove,
  step,
  refresh,
  apply,
  enter,
  logout,
  decide,
  decideOperatorRequest,
} = useAdminPortal()
const config = useRuntimeConfig()
const route = useRoute()
const oauthFailed = computed(() => isGoogleAuthError(route.query))
const googleStartUrl = computed(
  () => buildGoogleStartUrl(config.public.apiBase, 'admin'),
)
const confirmation = ref<{
  kind: 'team' | 'operator'
  id: number
  decision: AccessRequestDecision
} | null>(null)
const logoutConfirmation = ref(false)
const mainContent = ref<HTMLElement | null>(null)
const requestStatus = computed(() => accessRequest.value?.status)
const requestCopy = computed(() => getAccessRequestStateCopy(requestStatus.value))

async function confirmDecision() {
  if (!confirmation.value) return
  const { kind, id, decision } = confirmation.value
  confirmation.value = null
  await (kind === 'operator' ? decideOperatorRequest(id, decision) : decide(id, decision))
}

async function focusAfter(action: () => Promise<void>) {
  await action()
  await nextTick()
  const heading = mainContent.value?.querySelector('h1')
  if (heading) {
    heading.tabIndex = -1
    heading.focus()
  }
}

async function confirmLogout() {
  logoutConfirmation.value = false
  await focusAfter(logout)
}
</script>

<template>
  <div class="admin-portal">
    <a class="skip-link" href="#admin-content">ログイン操作へ移動</a>

    <aside class="editorial-panel" aria-label="管理者ポータルのご案内">
      <NuxtLink class="brand" to="/" aria-label="Anabuki Event トップへ">
        <span class="brand-mark" aria-hidden="true"><i /><i /><i /><i /></span>
        <span>ANABUKI <small>EVENT ADMIN</small></span>
      </NuxtLink>

      <div class="editorial-copy">
        <p class="eyebrow">QUIZ EVENT MANAGEMENT</p>
        <h2>運営を、<br ><em>はじめましょう。</em></h2>
        <p class="lead">
          クイズ大会を支える運営チームのための、<br >
          安全な管理者ポータルです。
        </p>
      </div>

      <p class="school-name">
        穴吹ITビジネスカレッジ
        <span>AIテクノロジー学科 · クイズ大会</span>
      </p>
    </aside>

    <section class="workspace-panel">
      <header class="workspace-header">
        <span class="private-label"><PortalIcon name="lock" /> 管理者専用</span>
        <NuxtLink to="/" class="participant-link">参加者トップへ <PortalIcon name="arrow" /></NuxtLink>
      </header>

      <main id="admin-content" ref="mainContent" class="auth-content" tabindex="-1">
        <ol class="progress" aria-label="管理画面の利用手順">
          <li
            v-for="(label, index) in adminWorkflowSteps"
            :key="label"
            :class="{ current: step === index + 1, complete: step > index + 1 }"
            :aria-current="step === index + 1 ? 'step' : undefined"
          >
            <span class="step-number"><PortalIcon v-if="step > index + 1" name="check" /><template v-else>0{{ index + 1 }}</template></span>
            <span>{{ label }}</span>
          </li>
        </ol>

        <div v-if="notice" class="notice-message" role="status"><PortalIcon name="info" /><p>{{ notice }}</p></div>
        <div v-if="error" class="error-message" role="alert">
          <p>{{ error }}</p>
          <button class="text-button" :disabled="busy" @click="refresh">最新の状態を確認 <PortalIcon name="refresh" /></button>
        </div>

        <section v-if="!ready" class="loading-state" :aria-busy="busy" aria-labelledby="loading-title">
          <span v-if="busy" class="spinner" aria-hidden="true" />
          <p class="eyebrow">ADMIN ACCESS</p>
          <h1 id="loading-title">{{ busy ? 'ログイン状態を確認しています' : '接続を確認してください' }}</h1>
          <p>安全にご利用いただくため、認証情報を確認します。</p>
        </section>

        <section v-else-if="!session" class="login-section" aria-labelledby="login-title">
          <p class="eyebrow">ADMIN ACCESS</p>
          <h1 id="login-title">管理者としてログイン</h1>
          <p class="intro">Google アカウントで本人確認を行い、<br >管理ポータルへアクセスします。</p>

          <div v-if="oauthFailed" class="error-message oauth-error" role="alert">
            <p>Google ログインを完了できませんでした。ログインを中止した場合や時間が経過した場合は、もう一度お試しください。</p>
          </div>

          <a v-if="configured && !departing" class="google-button" :href="googleStartUrl" @click="departing = true">
            <GoogleLogo />
            Google でログイン <PortalIcon name="arrow" />
          </a>
          <button v-else class="google-button" disabled>
            <span v-if="departing" class="spinner" />{{ departing ? 'Google に移動しています…' : '現在ログインを利用できません' }}
          </button>
          <p v-if="configured" class="secure-note"><PortalIcon name="lock" />このサイトでのパスワード入力は不要です。</p>
          <div v-else class="configuration-note" role="status">
            <p>Google ログインの設定が完了していません。運営担当者へお問い合わせください。</p>
            <button class="text-button" :disabled="busy" @click="refresh">設定を再確認 <PortalIcon name="refresh" /></button>
          </div>

          <div class="first-visit">
            <span class="small-icon"><PortalIcon name="info" /></span>
            <div><h2>はじめて利用する方へ</h2><p>ログイン後に利用申請を送信できます。管理者が承認するまで、管理機能は利用できません。</p></div>
          </div>
          <details class="help-details">
            <summary>ログイン・申請について</summary>
            <div class="help-content">
              <p>すでに承認済みのアカウントは、ログイン後すぐに管理ポータルへ進みます。</p>
              <p>申請の有効期限はログインから20分です。承認後も同じ端末・ブラウザから進んでください。ログアウトや再ログインをすると、承認待ちの申請は取り消されます。</p>
              <p>Google 側でログインを中止した場合やエラーになった場合は、この画面に戻り、もう一度お試しください。</p>
            </div>
          </details>
        </section>

        <section v-else-if="!isManager" class="application-section" aria-labelledby="application-title" :aria-busy="busy">
          <span class="state-badge" :class="{ approved: requestStatus === 'APPROVED', pending: requestStatus === 'PENDING' }"><PortalIcon :name="requestStatus === 'PENDING' ? 'clock' : 'info'" />{{ requestCopy.label }}</span>
          <h1 id="application-title" class="state-title">{{ requestCopy.title }}</h1>
          <p class="intro">{{ requestCopy.description }}</p>
          <div class="account-card"><span class="account-avatar" aria-hidden="true">{{ session.email[0]?.toUpperCase() }}</span><div><span class="meta-label">ログイン中のアカウント</span><strong>{{ session.email }}</strong></div></div>
          <dl v-if="accessRequest" class="request-meta"><div><dt>申請番号</dt><dd>#{{ accessRequest.id }}</dd></div><div><dt>有効期限（日本時間）</dt><dd>{{ formatAdminDate(accessRequest.expiresAt) }}</dd></div></dl>
          <button v-if="!accessRequest || requestStatus === 'REJECTED'" class="primary-button" :disabled="busy" @click="focusAfter(apply)">{{ busy ? '確認しています…' : requestStatus === 'REJECTED' ? 'もう一度利用を申請する' : '管理者へ利用を申請する' }} <PortalIcon name="arrow" /></button>
          <button v-else-if="requestStatus === 'APPROVED'" class="primary-button" :disabled="busy" @click="focusAfter(enter)">{{ busy ? '管理セッションに切り替えています…' : '管理ポータルへ進む' }} <PortalIcon name="arrow" /></button>
          <button v-else-if="requestStatus === 'PENDING'" class="secondary-button" :disabled="busy" @click="refresh"><PortalIcon name="refresh" />{{ busy ? '確認しています…' : '承認状況を確認する' }}</button>
          <p v-if="requestStatus === 'PENDING'" class="secure-note"><span class="live-dot" />10秒ごとに自動確認します。別のブラウザを開かずにお待ちください。</p>
          <div class="device-note"><PortalIcon name="lock" /><p>申請はこの端末・ブラウザに紐づいています。ログインから20分以内に、承認と管理セッションへの切り替えを完了してください。</p></div>
        </section>

        <section v-else class="management-section" aria-labelledby="management-title" :aria-busy="busy">
          <span class="state-badge approved"><PortalIcon name="check" />管理者としてログイン中</span>
          <h1 id="management-title" class="state-title">運営を、はじめましょう。</h1>
          <p class="intro">アカウント・チーム・オペレーターの利用申請を確認できます。</p>
          <div class="account-card"><span class="account-avatar" aria-hidden="true">{{ session.email[0]?.toUpperCase() }}</span><div><span class="meta-label">{{ session.accessSource === 'ENVIRONMENT_ACCESS' ? '環境設定による管理アクセス' : '承認済みの管理アクセス' }}</span><strong>{{ session.email }}</strong></div></div>
          <p class="session-expiry">セッション有効期限：{{ formatAdminDate(session.expiresAt) }}（日本時間）</p>
          <div v-if="canApprove" class="approval-inbox">
            <div class="inbox-heading"><h2>チームの利用申請 <span>{{ pendingRequests.length }}</span></h2><button class="icon-button" aria-label="利用申請を更新" :disabled="busy" @click="refresh"><PortalIcon name="refresh" /></button></div>
            <p class="inbox-description">申請者本人と確認してから承認してください。</p>
            <div v-if="pendingRequests.length === 0" class="empty-inbox"><span class="empty-icon"><PortalIcon name="check" /></span><strong>承認待ちの申請はありません</strong><p>新しい申請は、更新ボタンで確認できます。</p></div>
            <ul v-else class="request-list"><li v-for="item in pendingRequests" :key="item.id"><div class="request-identity"><span class="account-avatar" aria-hidden="true">{{ item.email[0]?.toUpperCase() }}</span><div><strong>{{ item.email }}</strong><p>申請 #{{ item.id }} · {{ formatAdminDate(item.expiresAt) }} まで</p></div></div><div class="request-actions"><button class="small-button" :disabled="busy" @click="confirmation = { kind: 'team', id: item.id, decision: 'reject' }">却下</button><button class="small-button approve-button" :disabled="busy" @click="confirmation = { kind: 'team', id: item.id, decision: 'approve' }">承認する</button></div></li></ul>
          </div>
          <div v-if="canApprove" class="approval-inbox operator-inbox">
            <div class="inbox-heading"><h2>オペレーター申請 <span>{{ pendingOperatorRequests.length }}</span></h2><button class="icon-button" aria-label="オペレーター申請を更新" :disabled="busy" @click="refresh"><PortalIcon name="refresh" /></button></div>
            <p class="inbox-description">イベント運営（オペレーター）ページの利用を希望する申請です。申請者本人と確認してから承認してください。</p>
            <div v-if="pendingOperatorRequests.length === 0" class="empty-inbox"><span class="empty-icon"><PortalIcon name="check" /></span><strong>承認待ちのオペレーター申請はありません</strong><p>新しい申請は、更新ボタンで確認できます。</p></div>
            <ul v-else class="request-list"><li v-for="item in pendingOperatorRequests" :key="item.id"><div class="request-identity"><span class="account-avatar operator-avatar" aria-hidden="true">{{ item.email[0]?.toUpperCase() }}</span><div><strong>{{ item.email }}</strong><p>申請 #{{ item.id }} · {{ formatAdminDate(item.expiresAt) }} まで</p></div></div><div class="request-actions"><button class="small-button" :disabled="busy" @click="confirmation = { kind: 'operator', id: item.id, decision: 'reject' }">却下</button><button class="small-button approve-button operator-approve" :disabled="busy" @click="confirmation = { kind: 'operator', id: item.id, decision: 'approve' }">承認する</button></div></li></ul>
          </div>
          <button class="logout-button" :disabled="busy" @click="logoutConfirmation = true"><PortalIcon name="logout" />ログアウト</button>
        </section>
      </main>

      <footer class="workspace-footer"><p>管理機能はPCでの利用を推奨しています。</p><span>ANABUKI EVENT</span></footer>
    </section>

    <div v-if="confirmation" class="modal-backdrop" role="presentation">
      <section class="confirmation-dialog" role="dialog" aria-modal="true" aria-labelledby="decision-title">
        <p class="eyebrow">CONFIRMATION</p><h2 id="decision-title">{{ confirmation.decision === 'approve' ? (confirmation.kind === 'operator' ? 'このオペレーター申請を承認しますか？' : 'この申請を承認しますか？') : (confirmation.kind === 'operator' ? 'このオペレーター申請を却下しますか？' : 'この申請を却下しますか？') }}</h2>
        <p>{{ confirmation.decision === 'approve' ? (confirmation.kind === 'operator' ? '承認すると、申請者はこの端末からオペレーター画面へ進めます。' : '承認すると、申請者はこの端末から管理ポータルへ進めます。') : '却下した申請者は、必要に応じて再申請できます。' }}</p>
        <div class="modal-actions"><button class="small-button" @click="confirmation = null">戻る</button><button class="small-button approve-button" :disabled="busy" @click="confirmDecision">{{ confirmation.decision === 'approve' ? '承認する' : '却下する' }}</button></div>
      </section>
    </div>
    <div v-if="logoutConfirmation" class="modal-backdrop" role="presentation">
      <section class="confirmation-dialog" role="dialog" aria-modal="true" aria-labelledby="logout-title">
        <p class="eyebrow">SIGN OUT</p><h2 id="logout-title">ログアウトしますか？</h2><p>承認待ちの利用申請がある場合は取り消されます。</p>
        <div class="modal-actions"><button class="small-button" @click="logoutConfirmation = false">戻る</button><button class="small-button approve-button" :disabled="busy" @click="confirmLogout">ログアウト</button></div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.admin-portal { --ink:#23322c; --muted:#627068; --sage:#dce8de; --deep-sage:#386150; --blue:#1769c2; --line:#d9e1dc; min-height:100vh; display:grid; grid-template-columns:minmax(370px, 45%) 1fr; background:#fff; color:var(--ink); font-family:Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Hiragino Sans", sans-serif; }
.skip-link { position:fixed; top:8px; left:8px; z-index:10; transform:translateY(-150%); padding:10px 16px; background:#fff; color:var(--blue); border:2px solid var(--blue); border-radius:6px; }.skip-link:focus { transform:translateY(0); }
.editorial-panel { position:relative; display:flex; min-height:100vh; flex-direction:column; overflow:hidden; padding:48px clamp(32px, 7vw, 104px) 38px; background:var(--sage); }.editorial-panel::before { content:""; position:absolute; right:-160px; top:160px; width:390px; height:390px; border:1px solid #b5cdbb; border-radius:50%; }.editorial-panel::after { content:""; position:absolute; left:-80px; bottom:88px; width:220px; height:220px; border:1px solid #bfd3c3; border-radius:50%; }
.brand { position:relative; z-index:1; display:flex; align-items:center; gap:12px; color:inherit; font-size:18px; font-weight:760; letter-spacing:.05em; text-decoration:none; }.brand small { display:block; margin-top:2px; color:#486758; font-size:10px; font-weight:600; letter-spacing:.12em; }.brand-mark { display:grid; grid-template-columns:repeat(2, 10px); gap:3px; }.brand-mark i { display:block; width:10px; height:10px; background:var(--deep-sage); }.brand-mark i:nth-child(2),.brand-mark i:nth-child(3) { background:#789d83; }
.editorial-copy { position:relative; z-index:1; margin-top:clamp(70px, 14vh, 160px); }.eyebrow { margin:0 0 14px; color:#527261; font-size:11px; font-weight:750; letter-spacing:.14em; }.editorial-copy h2 { margin:0; font-family:ui-serif, Georgia, "Hiragino Mincho ProN", serif; font-size:clamp(38px, 4vw, 61px); font-weight:500; letter-spacing:-.08em; line-height:1.2; }.editorial-copy h2 em { color:var(--deep-sage); font-style:normal; }.lead { max-width:360px; margin:28px 0 0; color:#496153; font-size:15px; line-height:1.9; }
.school-name { position:relative; z-index:1; margin:auto 0 0; color:#466353; font-size:12px; }.school-name span { display:block; margin-top:5px; color:#6b8373; font-size:11px; }
.workspace-panel { display:flex; min-width:0; flex-direction:column; padding:34px clamp(32px, 7vw, 112px) 26px; }.workspace-header { display:flex; justify-content:space-between; align-items:center; gap:20px; min-height:36px; }.private-label,.participant-link { display:flex; align-items:center; gap:8px; color:#597066; font-size:12px; }.private-label svg { width:15px; }.participant-link { color:#466555; text-decoration:none; }.participant-link svg { width:16px; transition:transform .2s; }.participant-link:hover svg { transform:translateX(3px); }
.auth-content { width:min(100%, 520px); margin:auto; padding:64px 0; }.progress { display:flex; align-items:center; margin:0 0 55px; padding:0; list-style:none; color:#94a29a; font-size:11px; font-weight:650; }.progress li { display:flex; align-items:center; gap:7px; white-space:nowrap; }.progress li:not(:last-child)::after { width:clamp(20px, 4vw, 64px); height:1px; margin:0 12px; background:#d9e3dc; content:""; }.step-number { display:grid; width:22px; height:22px; place-items:center; border:1px solid #c8d8cc; border-radius:50%; font-size:9px; }.step-number svg { width:12px; }.progress .current,.progress .complete { color:var(--deep-sage); }.progress .current .step-number { border-color:var(--deep-sage); background:var(--deep-sage); color:#fff; }.progress .complete .step-number { border-color:#91ad99; background:#e3eee5; }
.auth-content h1 { margin:0; font-family:ui-serif, Georgia, "Hiragino Mincho ProN", serif; font-size:39px; font-weight:500; letter-spacing:-.06em; line-height:1.3; }.intro { margin:18px 0 0; color:var(--muted); font-size:14px; line-height:1.85; }.login-section,.application-section,.management-section,.loading-state { animation:appear .25s ease-out; }.login-section .google-button { margin-top:35px; }.google-button,.primary-button,.secondary-button { display:flex; box-sizing:border-box; align-items:center; justify-content:center; gap:12px; width:100%; min-height:52px; padding:12px 18px; border-radius:5px; font-size:14px; font-weight:650; text-decoration:none; cursor:pointer; }.google-button { color:#31423a; border:1px solid #b9c8bd; background:#fff; box-shadow:0 3px 8px #1d362008; }.google-button:hover:not(:disabled) { border-color:#71927a; background:#f8fbf8; }.google-button svg:last-child,.primary-button svg:last-child { width:17px; margin-left:auto; }.google-button:disabled,.primary-button:disabled,.secondary-button:disabled,.small-button:disabled,.icon-button:disabled { cursor:not-allowed; opacity:.65; }.secure-note { display:flex; align-items:center; gap:7px; margin:14px 0 0; color:#6b7d72; font-size:11px; line-height:1.5; }.secure-note svg { width:14px; }.configuration-note { margin-top:15px; padding:14px; border-left:3px solid #c59c56; background:#fff9ed; color:#775e32; font-size:12px; line-height:1.7; }.configuration-note p { margin:0; }.text-button { display:inline-flex; align-items:center; gap:5px; margin:9px 0 0; padding:0; border:0; color:inherit; background:transparent; font:inherit; font-size:12px; font-weight:700; cursor:pointer; }.text-button svg { width:14px; }
.first-visit { display:flex; gap:13px; margin-top:38px; padding:19px 20px; border-top:1px solid #dce5de; border-bottom:1px solid #dce5de; }.small-icon { display:grid; flex:0 0 auto; width:26px; height:26px; place-items:center; border-radius:50%; color:var(--deep-sage); background:#e1ede3; }.small-icon svg { width:15px; }.first-visit h2 { margin:1px 0 6px; font-size:13px; }.first-visit p { margin:0; color:var(--muted); font-size:12px; line-height:1.7; }.help-details { margin-top:18px; color:#62746a; font-size:12px; }.help-details summary { cursor:pointer; font-weight:700; }.help-content { padding-top:9px; line-height:1.75; }.help-content p { margin:8px 0; }
.notice-message,.error-message { display:flex; align-items:flex-start; gap:10px; margin-bottom:22px; padding:13px 15px; font-size:12px; line-height:1.6; }.notice-message { color:#35604b; border:1px solid #c8ded0; background:#f2f8f3; }.error-message { display:block; color:#8e3728; border:1px solid #ecd0c9; background:#fff6f3; }.notice-message p,.error-message p { margin:0; }.notice-message svg { flex:0 0 auto; width:16px; margin-top:2px; }.oauth-error { margin-top:20px; }
.state-badge { display:inline-flex; align-items:center; gap:6px; margin-bottom:16px; padding:6px 10px; color:#557062; background:#eef5ef; font-size:11px; font-weight:700; }.state-badge svg { width:14px; }.state-badge.pending { color:#76602c; background:#fbf5e4; }.state-badge.approved { color:#336b4b; background:#e8f4eb; }.state-title { font-size:34px !important; }.account-card { display:flex; align-items:center; gap:12px; margin-top:27px; padding:16px; border:1px solid var(--line); background:#fbfdfb; }.account-avatar { display:grid; flex:0 0 auto; width:37px; height:37px; place-items:center; border-radius:50%; color:#fff; background:#6f9178; font-size:14px; font-weight:700; }.meta-label { display:block; margin-bottom:3px; color:#718078; font-size:10px; }.account-card strong { font-size:13px; overflow-wrap:anywhere; }.request-meta { display:grid; grid-template-columns:1fr 1fr; gap:1px; margin:14px 0 0; background:var(--line); }.request-meta div { padding:12px; background:#fff; }.request-meta dt { color:#748078; font-size:10px; }.request-meta dd { margin:5px 0 0; font-size:12px; font-weight:650; }.primary-button { margin-top:22px; color:#fff; border:1px solid var(--deep-sage); background:var(--deep-sage); }.primary-button:hover:not(:disabled) { background:#284e3f; }.secondary-button { margin-top:22px; color:#416651; border:1px solid #a8c2af; background:#fff; }.live-dot { width:7px; height:7px; border-radius:50%; background:#6b9875; }.device-note { display:flex; gap:9px; margin-top:28px; padding:14px; color:#65766c; background:#f5f8f5; font-size:11px; line-height:1.7; }.device-note svg { flex:0 0 auto; width:15px; margin-top:1px; }.device-note p { margin:0; }
.session-expiry { margin:11px 0 0; color:var(--muted); font-size:11px; }.approval-inbox { margin-top:34px; }.inbox-heading { display:flex; align-items:center; justify-content:space-between; gap:12px; }.inbox-heading h2 { margin:0; font-size:16px; }.inbox-heading h2 span { display:inline-grid; min-width:22px; height:22px; margin-left:5px; place-items:center; border-radius:50%; color:#476d55; background:#e8f1e9; font-size:11px; }.icon-button { display:grid; width:38px; height:38px; place-items:center; border:1px solid var(--line); color:#527061; background:#fff; cursor:pointer; }.icon-button svg { width:16px; }.inbox-description { margin:8px 0 0; color:var(--muted); font-size:12px; }.empty-inbox { display:grid; justify-items:center; gap:7px; margin-top:16px; padding:24px; border:1px solid #dce7de; background:#f7faf7; text-align:center; }.empty-icon { color:#568265; }.empty-inbox strong { font-size:13px; }.empty-inbox p { margin:0; color:var(--muted); font-size:11px; }.request-list { margin:14px 0 0; padding:0; list-style:none; }.request-list > li { padding:15px; border:1px solid var(--line); }.request-list > li + li { margin-top:9px; }.request-identity { display:flex; gap:10px; align-items:center; }.request-identity strong { font-size:13px; overflow-wrap:anywhere; }.request-identity p { margin:4px 0 0; color:var(--muted); font-size:11px; }.request-actions,.modal-actions { display:flex; justify-content:flex-end; gap:8px; margin-top:13px; }.small-button,.logout-button { min-height:40px; padding:8px 13px; border:1px solid #b7c9bb; background:#fff; color:#466553; font-size:12px; font-weight:650; cursor:pointer; }.approve-button { color:#fff; border-color:var(--deep-sage); background:var(--deep-sage); }
.operator-inbox { border-top:1px dashed var(--line); padding-top:22px; }
.operator-inbox .inbox-heading h2 span { color:#1c5fae; background:#e2edfa; }
.operator-avatar { background:#5b87c2; }
.operator-approve { border-color:var(--blue); background:var(--blue); }.logout-button { display:flex; align-items:center; gap:7px; margin:32px 0 0; }.logout-button svg { width:15px; }.workspace-footer { display:flex; justify-content:space-between; gap:12px; color:#829188; font-size:10px; }.workspace-footer p { margin:0; }.workspace-footer span { font-weight:700; letter-spacing:.12em; }
.modal-backdrop { position:fixed; z-index:5; inset:0; display:grid; place-items:center; padding:20px; background:#1e302855; }.confirmation-dialog { width:min(100%, 390px); padding:28px; background:#fff; box-shadow:0 20px 60px #15251d55; }.confirmation-dialog h2 { margin:0; font-family:ui-serif, Georgia, serif; font-size:24px; font-weight:500; }.confirmation-dialog > p:last-of-type { color:var(--muted); font-size:13px; line-height:1.7; }.spinner { display:inline-block; width:17px; height:17px; border:2px solid #d7e4d9; border-top-color:var(--deep-sage); border-radius:50%; animation:rotate .8s linear infinite; }.loading-state .spinner { margin-bottom:20px; }.loading-state > p:last-child { color:var(--muted); font-size:13px; }.loading-state h1 { margin-bottom:14px; }
button:focus-visible,a:focus-visible,summary:focus-visible { outline:3px solid #1769c2; outline-offset:3px; } @keyframes rotate { to { transform:rotate(360deg); } } @keyframes appear { from { opacity:0; transform:translateY(5px); } to { opacity:1; transform:translateY(0); } }
@media (max-width: 850px) { .admin-portal { grid-template-columns:1fr; }.editorial-panel { min-height:auto; padding:28px 32px; }.editorial-copy { margin-top:42px; }.editorial-copy h2 { font-size:35px; }.school-name { display:none; }.workspace-panel { min-height:calc(100vh - 245px); padding:24px 32px; }.auth-content { margin:25px auto; padding:32px 0; } }
@media (max-width: 500px) { .editorial-panel { padding:24px 20px; }.editorial-copy { margin-top:34px; }.editorial-copy h2 { font-size:29px; }.lead { margin-top:13px; font-size:13px; }.workspace-panel { padding:20px; }.private-label { display:none; }.auth-content { margin-top:16px; padding-top:20px; }.progress { margin-bottom:38px; }.progress li { gap:5px; font-size:10px; }.progress li:not(:last-child)::after { width:18px; margin:0 7px; }.auth-content h1 { font-size:31px; }.state-title { font-size:28px !important; }.workspace-footer { flex-direction:column; }.request-meta { grid-template-columns:1fr; }.editorial-panel::before { display:none; } }
@media (prefers-reduced-motion:reduce) { .admin-portal *, .admin-portal *::before, .admin-portal *::after { animation:none !important; transition:none !important; } }
</style>
