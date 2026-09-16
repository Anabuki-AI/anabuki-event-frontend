<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'
import { buildGoogleStartUrl, isGoogleAuthError } from '~/lib/auth/google'
import { formatJapanDateTime } from '~/lib/format/datetime'
import { useOperatorPortal } from '../composables/useOperatorPortal'
import { getAccessRequestStateCopy } from '../portal-presentation'

const {
  session,
  accessRequest,
  configured,
  busy,
  ready,
  error,
  notice,
  departing,
  isManager,
  refresh,
  apply,
  enter,
  logout,
} = useOperatorPortal()
const config = useRuntimeConfig()
const route = useRoute()
const oauthFailed = computed(() => isGoogleAuthError(route.query))
const googleStartUrl = computed(
  () => buildGoogleStartUrl(config.public.apiBase, 'operator'),
)
const logoutConfirmation = ref(false)
const mainContent = ref<HTMLElement | null>(null)
const requestStatus = computed(() => accessRequest.value?.status)
const requestCopy = computed(() => getAccessRequestStateCopy(requestStatus.value))

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
  <div class="operator-portal">
    <a class="skip-link" href="#operator-content">ログイン操作へ移動</a>

    <aside class="editorial-panel" aria-label="イベントオペレーターポータルのご案内">
      <NuxtLink class="brand" to="/" aria-label="Anabuki Event トップへ">
        <span class="brand-mark" aria-hidden="true"><i /><i /><i /><i /></span>
        <span>ANABUKI <small>EVENT OPERATOR</small></span>
      </NuxtLink>

      <div class="editorial-copy">
        <p class="eyebrow">QUIZ EVENT OPERATIONS</p>
        <h2>イベントを、<br ><em>はじめましょう。</em></h2>
        <p class="lead">
          クイズ大会を開催するオペレーターのための、<br >
          安全なイベント運営ポータルです。
        </p>
      </div>

      <p class="school-name">
        穴吹ITビジネスカレッジ
        <span>AIテクノロジー学科 · クイズ大会</span>
      </p>
    </aside>

    <section class="workspace-panel">
      <header class="workspace-header">
        <span class="private-label"><PortalIcon name="lock" /> オペレーター専用</span>
        <NuxtLink to="/" class="participant-link">参加者トップへ <PortalIcon name="arrow" /></NuxtLink>
      </header>

      <main id="operator-content" ref="mainContent" class="auth-content" tabindex="-1">
        <div v-if="notice" class="notice-message" role="status"><PortalIcon name="info" /><p>{{ notice }}</p></div>
        <div v-if="error" class="error-message" role="alert">
          <p>{{ error }}</p>
          <button class="text-button" :disabled="busy" @click="refresh">最新の状態を確認 <PortalIcon name="refresh" /></button>
        </div>

        <section v-if="!ready" class="loading-state" :aria-busy="busy" aria-labelledby="loading-title">
          <span v-if="busy" class="spinner" aria-hidden="true" />
          <p class="eyebrow">OPERATOR ACCESS</p>
          <h1 id="loading-title">{{ busy ? 'ログイン状態を確認しています' : '接続を確認してください' }}</h1>
          <p>安全にご利用いただくため、認証情報を確認します。</p>
        </section>

        <section v-else-if="!session" class="login-section" aria-labelledby="login-title">
          <p class="eyebrow">OPERATOR ACCESS</p>
          <h1 id="login-title">オペレーターとしてログイン</h1>
          <p class="intro">Google アカウントで本人確認を行い、<br >イベント運営ポータルへアクセスします。</p>

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
            <div><h2>イベント開催者の方へ</h2><p>ログイン後、運営管理者への利用申請を送信できます。承認されるまで、運営機能は利用できません。参加者用のページではありません。</p></div>
          </div>
          <details class="help-details">
            <summary>ログイン・申請について</summary>
            <div class="help-content">
              <p>すでに承認済みのアカウントは、ログイン後すぐにオペレーター画面へ進みます。</p>
              <p>はじめて利用する場合は、ログイン後に運営管理者へ利用申請を送信してください。承認待ちの間は、この画面が自動で最新の状態を確認します。</p>
              <p>Google 側でログインを中止した場合やエラーになった場合は、この画面に戻り、もう一度お試しください。</p>
              <p>このポータルは PC・タブレットでの利用を想定しています。</p>
            </div>
          </details>
        </section>

        <section v-else-if="!isManager" class="application-section" aria-labelledby="application-title" :aria-busy="busy">
          <span class="state-badge" :class="{ approved: requestStatus === 'APPROVED', pending: requestStatus === 'PENDING' }"><PortalIcon :name="requestStatus === 'PENDING' ? 'clock' : 'info'" />{{ requestCopy.label }}</span>
          <h1 id="application-title" class="state-title">{{ requestCopy.title }}</h1>
          <p class="intro">{{ requestCopy.description }}</p>
          <div class="account-card"><span class="account-avatar" aria-hidden="true">{{ session.email[0]?.toUpperCase() }}</span><div><span class="meta-label">ログイン中のアカウント</span><strong>{{ session.email }}</strong></div></div>
          <dl v-if="accessRequest" class="request-meta"><div><dt>申請番号</dt><dd>#{{ accessRequest.id }}</dd></div><div><dt>有効期限（日本時間）</dt><dd>{{ formatJapanDateTime(accessRequest.expiresAt) }}</dd></div></dl>
          <button v-if="!accessRequest || requestStatus === 'REJECTED'" class="primary-button" :disabled="busy" @click="focusAfter(apply)">{{ busy ? '確認しています…' : requestStatus === 'REJECTED' ? 'もう一度利用を申請する' : '運営管理者へ利用を申請する' }} <PortalIcon name="arrow" /></button>
          <button v-else-if="requestStatus === 'APPROVED'" class="primary-button" :disabled="busy" @click="focusAfter(enter)">{{ busy ? '運営セッションに切り替えています…' : '運営を開始' }} <PortalIcon name="arrow" /></button>
          <button v-else-if="requestStatus === 'PENDING'" class="secondary-button" :disabled="busy" @click="refresh"><PortalIcon name="refresh" />{{ busy ? '確認しています…' : '承認状況を確認する' }}</button>
          <p v-if="requestStatus === 'PENDING'" class="secure-note"><span class="live-dot" />10秒ごとに自動確認します。別のブラウザを開かずにお待ちください。</p>
          <div class="device-note"><PortalIcon name="lock" /><p>申請はこの端末・ブラウザに紐づいています。承認後は、同じブラウザから「運営を開始」を押してください。</p></div>
        </section>

        <section v-else class="session-section" aria-labelledby="session-title" :aria-busy="busy">
          <span class="state-badge"><PortalIcon name="check" />オペレーターとしてログイン中</span>
          <h1 id="session-title" class="state-title">イベント運営を、はじめましょう。</h1>
          <p class="intro">クイズ大会の進行に必要な運営機能を利用できます。</p>
          <div class="account-card"><span class="account-avatar" aria-hidden="true">{{ session.email[0]?.toUpperCase() }}</span><div><span class="meta-label">ログイン中のアカウント</span><strong>{{ session.email }}</strong></div></div>
          <p class="session-expiry">セッション有効期限：{{ formatJapanDateTime(session.expiresAt) }}（日本時間）</p>
          <NuxtLink class="primary-button operator-entry-link" to="/event_operator">イベント運営画面へ <PortalIcon name="arrow" /></NuxtLink>
          <button class="logout-button" :disabled="busy" @click="logoutConfirmation = true"><PortalIcon name="logout" />ログアウト</button>
        </section>
      </main>

      <footer class="workspace-footer"><p>オペレーター機能はPC・タブレットでの利用を推奨しています。</p><span>ANABUKI EVENT</span></footer>
    </section>

    <div v-if="logoutConfirmation" class="modal-backdrop" role="presentation">
      <section class="confirmation-dialog" role="dialog" aria-modal="true" aria-labelledby="logout-title">
        <p class="eyebrow">SIGN OUT</p><h2 id="logout-title">ログアウトしますか？</h2><p>運営機能を利用するには、再度 Google でログインしてください。</p>
        <div class="modal-actions"><button class="small-button" @click="logoutConfirmation = false">戻る</button><button class="small-button confirm-button" :disabled="busy" @click="confirmLogout">ログアウト</button></div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.operator-portal { --ink:#132238; --muted:#5a6b85; --brand:#1769c2; --brand-deep:#0f4d92; --tint:#dbe6f7; --line:#d5dcec; min-height:100vh; display:grid; grid-template-columns:minmax(370px, 45%) 1fr; background:#fff; color:var(--ink); font-family:Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Hiragino Sans", sans-serif; }
.skip-link { position:fixed; top:8px; left:8px; z-index:10; transform:translateY(-150%); padding:10px 16px; background:#fff; color:var(--brand); border:2px solid var(--brand); border-radius:6px; }.skip-link:focus { transform:translateY(0); }
.editorial-panel { position:relative; display:flex; min-height:100vh; flex-direction:column; overflow:hidden; padding:48px clamp(32px, 7vw, 104px) 38px; background:var(--tint); }.editorial-panel::before { content:""; position:absolute; right:-160px; top:160px; width:390px; height:390px; border:1px solid #b3c6e6; border-radius:50%; }.editorial-panel::after { content:""; position:absolute; left:-80px; bottom:88px; width:220px; height:220px; border:1px solid #bccded; border-radius:50%; }
.brand { position:relative; z-index:1; display:flex; align-items:center; gap:12px; color:inherit; font-size:18px; font-weight:760; letter-spacing:.05em; text-decoration:none; }.brand small { display:block; margin-top:2px; color:#3f5d8c; font-size:10px; font-weight:600; letter-spacing:.12em; }.brand-mark { display:grid; grid-template-columns:repeat(2, 10px); gap:3px; }.brand-mark i { display:block; width:10px; height:10px; background:var(--brand-deep); }.brand-mark i:nth-child(2),.brand-mark i:nth-child(3) { background:#6f9bd6; }
.editorial-copy { position:relative; z-index:1; margin-top:clamp(70px, 14vh, 160px); }.eyebrow { margin:0 0 14px; color:#42618f; font-size:11px; font-weight:750; letter-spacing:.14em; }.editorial-copy h2 { margin:0; font-family:ui-serif, Georgia, "Hiragino Mincho ProN", serif; font-size:clamp(38px, 4vw, 61px); font-weight:500; letter-spacing:-.08em; line-height:1.2; }.editorial-copy h2 em { color:var(--brand-deep); font-style:normal; }.lead { max-width:360px; margin:28px 0 0; color:#3d5378; font-size:15px; line-height:1.9; }
.school-name { position:relative; z-index:1; margin:auto 0 0; color:#41597f; font-size:12px; }.school-name span { display:block; margin-top:5px; color:#5f779d; font-size:11px; }
.workspace-panel { display:flex; min-width:0; flex-direction:column; padding:34px clamp(32px, 7vw, 112px) 26px; }.workspace-header { display:flex; justify-content:space-between; align-items:center; gap:20px; min-height:36px; }.private-label,.participant-link { display:flex; align-items:center; gap:8px; color:#54678a; font-size:12px; }.private-label svg { width:15px; }.participant-link { color:#3c5b8f; text-decoration:none; }.participant-link svg { width:16px; transition:transform .2s; }.participant-link:hover svg { transform:translateX(3px); }
.auth-content { width:min(100%, 520px); margin:auto; padding:64px 0; }.auth-content h1 { margin:0; font-family:ui-serif, Georgia, "Hiragino Mincho ProN", serif; font-size:39px; font-weight:500; letter-spacing:-.06em; line-height:1.3; }.intro { margin:18px 0 0; color:var(--muted); font-size:14px; line-height:1.85; }.login-section,.session-section,.application-section,.loading-state { animation:appear .25s ease-out; }.login-section .google-button { margin-top:35px; }.google-button { display:flex; box-sizing:border-box; align-items:center; justify-content:center; gap:12px; width:100%; min-height:52px; padding:12px 18px; border-radius:5px; font-size:14px; font-weight:650; text-decoration:none; cursor:pointer; color:#2c3f5e; border:1px solid #b4c3dc; background:#fff; box-shadow:0 3px 8px #16294a08; }.google-button:hover:not(:disabled) { border-color:#6e92c6; background:#f7fafd; }.google-button:disabled { cursor:not-allowed; opacity:.65; }.google-button svg:last-of-type { width:17px; margin-left:auto; }.secure-note { display:flex; align-items:center; gap:7px; margin:14px 0 0; color:#64759a; font-size:11px; line-height:1.5; }.secure-note svg { width:14px; }.configuration-note { margin-top:15px; padding:14px; border-left:3px solid #c59c56; background:#fff9ed; color:#775e32; font-size:12px; line-height:1.7; }.configuration-note p { margin:0; }.text-button { display:inline-flex; align-items:center; gap:5px; margin:9px 0 0; padding:0; border:0; color:inherit; background:transparent; font:inherit; font-size:12px; font-weight:700; cursor:pointer; }.text-button svg { width:14px; }
.first-visit { display:flex; gap:13px; margin-top:38px; padding:19px 20px; border-top:1px solid var(--line); border-bottom:1px solid var(--line); }.small-icon { display:grid; flex:0 0 auto; width:26px; height:26px; place-items:center; border-radius:50%; color:var(--brand-deep); background:#e3ecf9; }.small-icon svg { width:15px; }.first-visit h2 { margin:1px 0 6px; font-size:13px; }.first-visit p { margin:0; color:var(--muted); font-size:12px; line-height:1.7; }.help-details { margin-top:18px; color:#5f7191; font-size:12px; }.help-details summary { cursor:pointer; font-weight:700; }.help-content { padding-top:9px; line-height:1.75; }.help-content p { margin:8px 0; }
.notice-message,.error-message { display:flex; align-items:flex-start; gap:10px; margin-bottom:22px; padding:13px 15px; font-size:12px; line-height:1.6; }.notice-message { color:#275a86; border:1px solid #c3d8ee; background:#f1f7fd; }.error-message { display:block; color:#8e2f28; border:1px solid #eccfc9; background:#fff6f3; }.notice-message p,.error-message p { margin:0; }.notice-message svg { flex:0 0 auto; width:16px; margin-top:2px; }.oauth-error { margin-top:20px; }
.state-badge { display:inline-flex; align-items:center; gap:6px; margin-bottom:16px; padding:6px 10px; color:#2f5f96; background:#e8f1fb; font-size:11px; font-weight:700; }.state-badge svg { width:14px; }.state-badge.pending { color:#76602c; background:#fbf5e4; }.state-badge.approved { color:#2e6b4f; background:#e7f3ea; }.state-title { font-size:34px !important; }.account-card { display:flex; align-items:center; gap:12px; margin-top:27px; padding:16px; border:1px solid var(--line); background:#fafbfe; }.account-avatar { display:grid; flex:0 0 auto; width:37px; height:37px; place-items:center; border-radius:50%; color:#fff; background:#5b87c2; font-size:14px; font-weight:700; }.meta-label { display:block; margin-bottom:3px; color:#6d7f9e; font-size:10px; }.account-card strong { font-size:13px; overflow-wrap:anywhere; }
.request-meta { display:grid; grid-template-columns:1fr 1fr; gap:1px; margin:14px 0 0; background:var(--line); }.request-meta div { padding:12px; background:#fff; }.request-meta dt { color:#71809d; font-size:10px; }.request-meta dd { margin:5px 0 0; font-size:12px; font-weight:650; }
.primary-button,.secondary-button { display:flex; box-sizing:border-box; align-items:center; justify-content:center; gap:12px; width:100%; min-height:52px; margin-top:22px; padding:12px 18px; border-radius:5px; font-size:14px; font-weight:650; cursor:pointer; }.primary-button { color:#fff; border:1px solid var(--brand-deep); background:var(--brand-deep); }.primary-button:hover:not(:disabled) { background:#0c427e; }.primary-button svg:last-child { width:17px; margin-left:auto; }.secondary-button { color:#2c4a7c; border:1px solid #9fb6da; background:#fff; }.primary-button:disabled,.secondary-button:disabled { cursor:not-allowed; opacity:.65; }.live-dot { width:7px; height:7px; border-radius:50%; background:#5b8fc4; }
.device-note { display:flex; gap:9px; margin-top:28px; padding:14px; color:#5d6f8e; background:#f5f8fc; font-size:11px; line-height:1.7; }.device-note svg { flex:0 0 auto; width:15px; margin-top:1px; }.device-note p { margin:0; }
.session-expiry { margin:11px 0 0; color:var(--muted); font-size:11px; }.operator-entry-link { text-decoration:none; }.small-button,.logout-button { min-height:40px; padding:8px 13px; border:1px solid #b3c2da; background:#fff; color:#3c5b8f; font-size:12px; font-weight:650; cursor:pointer; }.small-button:disabled,.logout-button:disabled { cursor:not-allowed; opacity:.65; }.logout-button { display:flex; align-items:center; gap:7px; margin:32px 0 0; }.logout-button svg { width:15px; }.workspace-footer { display:flex; justify-content:space-between; gap:12px; color:#7f8ba3; font-size:10px; }.workspace-footer p { margin:0; }.workspace-footer span { font-weight:700; letter-spacing:.12em; }
.modal-backdrop { position:fixed; z-index:5; inset:0; display:grid; place-items:center; padding:20px; background:#16294a55; }.confirmation-dialog { width:min(100%, 390px); padding:28px; background:#fff; box-shadow:0 20px 60px #101f3a55; }.confirmation-dialog h2 { margin:0; font-family:ui-serif, Georgia, serif; font-size:24px; font-weight:500; }.confirmation-dialog > p:last-of-type { color:var(--muted); font-size:13px; line-height:1.7; }.modal-actions { display:flex; justify-content:flex-end; gap:8px; margin-top:13px; }.confirm-button { color:#fff; border-color:var(--brand-deep); background:var(--brand-deep); }.spinner { display:inline-block; width:17px; height:17px; border:2px solid #d4dfef; border-top-color:var(--brand-deep); border-radius:50%; animation:rotate .8s linear infinite; }.loading-state .spinner { margin-bottom:20px; }.loading-state > p:last-child { color:var(--muted); font-size:13px; }.loading-state h1 { margin-bottom:14px; }
button:focus-visible,a:focus-visible,summary:focus-visible { outline:3px solid var(--brand); outline-offset:3px; } @keyframes rotate { to { transform:rotate(360deg); } } @keyframes appear { from { opacity:0; transform:translateY(5px); } to { opacity:1; transform:translateY(0); } }
@media (max-width: 850px) { .operator-portal { grid-template-columns:1fr; }.editorial-panel { min-height:auto; padding:28px 32px; }.editorial-copy { margin-top:42px; }.editorial-copy h2 { font-size:35px; }.school-name { display:none; }.workspace-panel { min-height:calc(100vh - 245px); padding:24px 32px; }.auth-content { margin:25px auto; padding:32px 0; } }
@media (max-width: 500px) { .editorial-panel { padding:24px 20px; }.editorial-copy { margin-top:34px; }.editorial-copy h2 { font-size:29px; }.lead { margin-top:13px; font-size:13px; }.workspace-panel { padding:20px; }.private-label { display:none; }.auth-content { margin-top:16px; padding-top:20px; }.auth-content h1 { font-size:31px; }.state-title { font-size:28px !important; }.workspace-footer { flex-direction:column; }.editorial-panel::before { display:none; } }
@media (prefers-reduced-motion:reduce) { .operator-portal *, .operator-portal *::before, .operator-portal *::after { animation:none !important; transition:none !important; } }
</style>
