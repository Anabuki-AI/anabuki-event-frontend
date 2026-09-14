<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'
import PortalIcon from './PortalIcon.vue'
import { useAdminPortal } from '../composables/useAdminPortal'

const {
  session,
  accessRequest,
  pendingRequests,
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
} = useAdminPortal()
const config = useRuntimeConfig()
const route = useRoute()
const oauthFailed = computed(() => route.query.auth_error === 'google')
const googleStartUrl = computed(
  () => `${config.public.apiBase.replace(/\/$/, '')}/auth/google/start`,
)
const confirmation = ref<{ id: number; decision: 'approve' | 'reject' } | null>(
  null,
)
const logoutConfirmation = ref(false)
const mainContent = ref<HTMLElement | null>(null)
const requestStatus = computed(() => accessRequest.value?.status)
const requestCopy = computed(() => {
  switch (requestStatus.value) {
    case 'PENDING':
      return {
        label: '承認待ち',
        title: 'あと一歩。承認をお待ちください。',
        description:
          '利用申請を受け付けました。運営担当の管理者へ、下の申請番号とメールアドレスを伝えてください。',
      }
    case 'APPROVED':
      return {
        label: '承認済み',
        title: '準備が整いました。',
        description:
          '管理者から利用が承認されました。このブラウザで管理セッションに切り替えて、管理ポータルへ進んでください。',
      }
    case 'REJECTED':
      return {
        label: '申請が却下されました',
        title: '運営担当者へご確認ください。',
        description:
          '今回の申請は承認されませんでした。必要な権限について管理者に確認したうえで、再申請できます。',
      }
    case 'CANCELLED':
      return {
        label: '申請が取り消されました',
        title: 'もう一度、ログインから。',
        description:
          '有効期限切れやログイン状態の変更により、この申請は無効になりました。ログアウトして、再度 Google でログインしてください。',
      }
    default:
      return {
        label: '本人確認済み',
        title: '管理者に利用を申請しましょう。',
        description:
          'Google アカウントを確認できました。はじめて利用する方は、管理者の承認が必要です。',
      }
  }
})

function formatDate(value: string) {
  return new Intl.DateTimeFormat('ja-JP', {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Tokyo',
  }).format(new Date(value))
}

async function confirmDecision() {
  if (!confirmation.value) return
  const { id, decision } = confirmation.value
  confirmation.value = null
  await decide(id, decision)
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
    <header class="portal-header">
      <NuxtLink class="brand" to="/" aria-label="Anabuki Event トップへ">
        <span class="brand-symbol" aria-hidden="true">
          <i />
          <i />
          <i />
          <i />
        </span>
        <span>
          ANABUKI
          <span class="brand-sub">ADMIN CONSOLE</span>
        </span>
      </NuxtLink>
      <div class="workspace-header">
        <span class="portal-label">
          <PortalIcon name="lock" />
          管理者専用
        </span>
        <NuxtLink to="/" class="participant-link">
          参加者トップへ
          <PortalIcon name="arrow" />
        </NuxtLink>
      </div>
    </header>

    <aside class="story-panel" aria-label="Anabuki Event 管理者ポータル">
      <div class="story-content">
        <p class="section-label">
          <span />
          ANABUKI EVENT / MANAGEMENT
        </p>
        <h2>
          大会を支える、
          <br >
          <em>管理の拠点。</em>
        </h2>
        <p class="story-description">
          チームのアクセスを、ひとつの場所で。
          <br >
          クイズ大会の管理者ポータルです。
        </p>

        <div class="console-map" aria-labelledby="console-map-title">
          <div class="console-map-heading">
            <span class="console-symbol" aria-hidden="true">
              <PortalIcon name="console" />
            </span>
            <div>
              <span class="map-eyebrow">YOUR WORKSPACE</span>
              <h3 id="console-map-title">管理者ポータル</h3>
            </div>
            <span class="workspace-tag">運営チーム</span>
          </div>
          <ul class="capability-list">
            <li>
              <span class="capability-icon access-icon"><PortalIcon name="team" /></span>
              <div>
                <h3>利用申請と承認</h3>
                <p>チームに必要なアクセスを管理</p>
              </div>
              <span class="capability-index" aria-hidden="true">01</span>
            </li>
            <li>
              <span class="capability-icon identity-icon"><PortalIcon name="check" /></span>
              <div>
                <h3>アカウントの確認</h3>
                <p>ログイン中のアカウントを確認</p>
              </div>
              <span class="capability-index" aria-hidden="true">02</span>
            </li>
            <li>
              <span class="capability-icon session-icon"><PortalIcon name="lock" /></span>
              <div>
                <h3>セッションの管理</h3>
                <p>利用後はログアウトして安全に終了</p>
              </div>
              <span class="capability-index" aria-hidden="true">03</span>
            </li>
          </ul>
          <p class="map-note">利用できる管理機能は、アカウントの権限に応じて表示されます。</p>
        </div>
      </div>

      <div class="story-footer">
        <span>
          穴吹ITビジネスカレッジ
          <span>AIテクノロジー学科 · クイズ大会</span>
        </span>
        <span class="edition" aria-hidden="true">A / E</span>
      </div>
    </aside>

    <div class="workspace-panel">
      <main id="admin-content" ref="mainContent" class="auth-content" tabindex="-1">
        <ol class="progress" aria-label="管理画面の利用手順">
          <li
            v-for="(label, index) in ['ログイン', '利用申請', '管理画面']"
            :key="label"
            :class="{ current: step === index + 1, complete: step > index + 1 }"
            :aria-current="step === index + 1 ? 'step' : undefined"
          >
            <span class="step-number">
              <PortalIcon v-if="step > index + 1" name="check" />
              <template v-else>0{{ index + 1 }}</template>
            </span>
            <span>{{ label }}</span>
          </li>
        </ol>

        <div v-if="notice" class="notice-message" role="status">
          <PortalIcon name="info" />
          <p>{{ notice }}</p>
        </div>
        <div v-if="error" class="error-message" role="alert">
          <p>{{ error }}</p>
          <button class="text-button" :disabled="busy" @click="refresh">
            最新の状態を確認
            <PortalIcon name="refresh" />
          </button>
        </div>

        <section
          v-if="!ready"
          class="loading-state"
          :aria-busy="busy"
          aria-labelledby="loading-title"
        >
          <span v-if="busy" class="spinner" aria-hidden="true" />
          <h1 id="loading-title">
            {{
              busy ? 'ログイン状態を確認しています' : '接続を確認してください'
            }}
          </h1>
          <p>安全にご利用いただくため、認証情報を確認します。</p>
        </section>

        <section
          v-else-if="!session"
          aria-labelledby="login-title"
          class="login-section"
        >
          <span class="login-emblem" aria-hidden="true"><PortalIcon name="lock" /></span>
          <p class="section-label">ADMIN SIGN IN</p>
          <h1 id="login-title">管理者ログイン</h1>
          <p class="intro">
            Google アカウントでログインして、
            <br class="desktop-break" >
            管理ポータルにアクセスします。
          </p>

          <div
            v-if="oauthFailed"
            class="error-message oauth-error"
            role="alert"
          >
            <p>
              Google
              ログインを完了できませんでした。ログインを中止した場合や時間が経過した場合は、もう一度お試しください。
            </p>
          </div>

          <a
            v-if="configured && !departing"
            class="google-button"
            :href="googleStartUrl"
            @click="departing = true"
          >
            <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
              <path
                fill="#4285F4"
                d="M43.61 24.46c0-1.36-.12-2.66-.35-3.92H24v7.42h11a9.4 9.4 0 0 1-4.08 6.18v5.14h6.61c3.87-3.56 6.08-8.81 6.08-14.82Z"
              />
              <path
                fill="#34A853"
                d="M24 44c5.52 0 10.15-1.83 13.53-4.95l-6.61-5.14c-1.83 1.23-4.18 1.96-6.92 1.96-5.32 0-9.82-3.59-11.43-8.41H5.74v5.3A20 20 0 0 0 24 44Z"
              />
              <path
                fill="#FBBC05"
                d="M12.57 27.46a12 12 0 0 1 0-6.92v-5.3H5.74a20 20 0 0 0 0 17.52l6.83-5.3Z"
              />
              <path
                fill="#EA4335"
                d="M24 12.13c3 0 5.68 1.03 7.8 3.05l5.85-5.86A19.6 19.6 0 0 0 24 4 20 20 0 0 0 5.74 15.24l6.83 5.3C14.18 15.72 18.68 12.13 24 12.13Z"
              />
            </svg>
            Google でログイン
            <PortalIcon name="arrow" />
          </a>
          <button v-else class="google-button" disabled>
            <span v-if="departing" class="spinner" />
            {{
              departing
                ? 'Google に移動しています…'
                : '現在ログインを利用できません'
            }}
          </button>
          <p v-if="configured" class="secure-note">
            <PortalIcon name="lock" />
            <span>このサイトでのパスワード入力は不要です。</span>
          </p>
          <div v-else class="configuration-note" role="status">
            <p>
              Google
              ログインの設定が完了していません。運営担当者へお問い合わせください。
            </p>
            <button class="text-button" :disabled="busy" @click="refresh">
              設定を再確認
              <PortalIcon name="refresh" />
            </button>
          </div>

          <div class="first-visit">
            <span class="small-icon"><PortalIcon name="info" /></span>
            <div>
              <h2>はじめて利用する方へ</h2>
              <p>
                ログイン後に利用申請を送信できます。
                <br >
                管理者が承認するまで、管理機能は利用できません。
              </p>
            </div>
          </div>
          <details class="help-details">
            <summary>ログイン・申請について</summary>
            <div class="help-content">
              <p>
                すでに承認済みのアカウントは、ログイン後すぐに管理ポータルへ進みます。
              </p>
              <p>
                申請の有効期限はログインから20分です。承認後も同じ端末・ブラウザから進んでください。ログアウトや再ログインをすると、承認待ちの申請は取り消されます。
              </p>
              <p>
                Google
                側でログインを中止した場合やエラーになった場合は、この画面に戻り、もう一度お試しください。
              </p>
            </div>
          </details>
        </section>

        <section
          v-else-if="!isManager"
          class="application-section"
          aria-labelledby="application-title"
          :aria-busy="busy"
        >
          <span
            class="state-badge"
            :class="{
              approved: requestStatus === 'APPROVED',
              pending: requestStatus === 'PENDING',
            }"
          >
            <PortalIcon
              :name="requestStatus === 'PENDING' ? 'clock' : 'info'"
            />
            {{ requestCopy.label }}
          </span>
          <h1 id="application-title" class="state-title">
            {{ requestCopy.title }}
          </h1>
          <p class="intro">{{ requestCopy.description }}</p>
          <div class="account-card">
            <span class="account-avatar" aria-hidden="true">
              {{ session.email[0]?.toUpperCase() }}
            </span>
            <div>
              <span class="meta-label">ログイン中のアカウント</span>
              <strong>{{ session.email }}</strong>
            </div>
          </div>
          <dl v-if="accessRequest" class="request-meta">
            <div>
              <dt>申請番号</dt>
              <dd>#{{ accessRequest.id }}</dd>
            </div>
            <div>
              <dt>有効期限（日本時間）</dt>
              <dd>{{ formatDate(accessRequest.expiresAt) }}</dd>
            </div>
          </dl>
          <button
            v-if="!accessRequest || requestStatus === 'REJECTED'"
            class="primary-button"
            :disabled="busy"
            @click="focusAfter(apply)"
          >
            {{
              busy
                ? '確認しています…'
                : requestStatus === 'REJECTED'
                  ? 'もう一度利用を申請する'
                  : '管理者へ利用を申請する'
            }}
            <PortalIcon name="arrow" />
          </button>
          <button
            v-else-if="requestStatus === 'APPROVED'"
            class="primary-button"
            :disabled="busy"
            @click="focusAfter(enter)"
          >
            {{
              busy ? '管理セッションに切り替えています…' : '管理ポータルへ進む'
            }}
            <PortalIcon name="arrow" />
          </button>
          <button
            v-else-if="requestStatus === 'PENDING'"
            class="secondary-button"
            :disabled="busy"
            @click="refresh"
          >
            <PortalIcon name="refresh" />
            {{ busy ? '確認しています…' : '承認状況を確認する' }}
          </button>
          <p v-if="requestStatus === 'PENDING'" class="secure-note">
            <span class="live-dot" />
            10秒ごとに自動確認します。別のブラウザを開かずにお待ちください。
          </p>
          <div class="device-note">
            <PortalIcon name="lock" />
            <p>
              申請はこの端末・ブラウザに紐づいています。ログインから20分以内に、承認と管理セッションへの切り替えを完了してください。
            </p>
          </div>
        </section>

        <section
          v-else
          class="management-section"
          aria-labelledby="management-title"
          :aria-busy="busy"
        >
          <span class="state-badge approved">
            <PortalIcon name="check" />
            管理者としてログイン中
          </span>
          <h1 id="management-title" class="state-title">
            管理ポータル
          </h1>
          <p class="intro">
            アカウントとチームの利用申請を確認できます。
          </p>
          <div class="account-card">
            <span class="account-avatar" aria-hidden="true">
              {{ session.email[0]?.toUpperCase() }}
            </span>
            <div>
              <span class="meta-label">
                {{
                  session.accessSource === 'ENVIRONMENT_ACCESS'
                    ? '環境設定による管理アクセス'
                    : '承認済みの管理アクセス'
                }}
              </span>
              <strong>{{ session.email }}</strong>
            </div>
          </div>
          <p class="session-expiry">
            セッション有効期限：{{ formatDate(session.expiresAt) }}（日本時間）
          </p>
          <div v-if="canApprove" class="approval-inbox">
            <div class="inbox-heading">
              <h2>
                チームの利用申請
                <span>{{ pendingRequests.length }}</span>
              </h2>
              <button
                class="icon-button"
                aria-label="利用申請を更新"
                :disabled="busy"
                @click="refresh"
              >
                <PortalIcon name="refresh" />
              </button>
            </div>
            <p class="inbox-description">
              申請者本人と確認してから承認してください。
            </p>
            <div v-if="pendingRequests.length === 0" class="empty-inbox">
              <span class="empty-icon"><PortalIcon name="check" /></span>
              <strong>承認待ちの申請はありません</strong>
              <p>新しい申請は、更新ボタンで確認できます。</p>
            </div>
            <ul v-else class="request-list">
              <li v-for="item in pendingRequests" :key="item.id">
                <div class="request-identity">
                  <span class="meta-label">
                    申請 #{{ item.id }} · {{ formatDate(item.expiresAt) }} まで
                  </span>
                  <strong>{{ item.email }}</strong>
                </div>
                <div
                  v-if="confirmation?.id === item.id"
                  class="decision-confirmation"
                  role="group"
                  :aria-label="`申請 ${item.id} の操作確認`"
                >
                  <p>
                    {{
                      confirmation.decision === 'approve'
                        ? 'この方に管理権限を付与しますか？'
                        : 'この申請を却下しますか？'
                    }}
                  </p>
                  <div class="request-actions">
                    <button
                      class="small-button"
                      :disabled="busy"
                      @click="confirmation = null"
                    >
                      戻る
                    </button>
                    <button
                      class="small-button approve-button"
                      :disabled="busy"
                      @click="confirmDecision"
                    >
                      {{
                        confirmation.decision === 'approve'
                          ? '確認して承認'
                          : '確認して却下'
                      }}
                    </button>
                  </div>
                </div>
                <div v-else class="request-actions">
                  <button
                    class="small-button"
                    :disabled="busy"
                    :aria-label="`${item.email} の申請を却下`"
                    @click="confirmation = { id: item.id, decision: 'reject' }"
                  >
                    却下
                  </button>
                  <button
                    class="small-button approve-button"
                    :disabled="busy"
                    :aria-label="`${item.email} の申請を承認`"
                    @click="confirmation = { id: item.id, decision: 'approve' }"
                  >
                    承認する
                  </button>
                </div>
              </li>
            </ul>
          </div>
        </section>

        <div v-if="session && ready" class="session-actions">
          <div
            v-if="logoutConfirmation"
            class="logout-confirmation"
            role="group"
            aria-label="ログアウトの確認"
          >
            <p>
              {{
                requestStatus === 'PENDING'
                  ? 'ログアウトすると、承認待ちの申請は取り消されます。ログアウトしますか？'
                  : 'この端末からログアウトしますか？'
              }}
            </p>
            <button
              class="text-button"
              :disabled="busy"
              @click="logoutConfirmation = false"
            >
              戻る
            </button>
            <button class="text-button" :disabled="busy" @click="confirmLogout">
              ログアウトする
              <PortalIcon name="logout" />
            </button>
          </div>
          <button
            v-else
            class="text-button"
            :disabled="busy"
            @click="logoutConfirmation = true"
          >
            <PortalIcon name="logout" />
            ログアウト・アカウントを変更
          </button>
        </div>
      </main>
    </div>

    <footer class="workspace-footer">
      <span>ANABUKI EVENT</span>
      <p>
        管理機能は PC でご利用ください。
        <br class="mobile-break" >
        共用端末では、利用後にログアウトを。
      </p>
    </footer>
  </div>
</template>

<style scoped>
.admin-portal {
  --ink: #22263d;
  --muted: #62677b;
  --blue: #1769c2;
  --line: #e2e3ed;
  min-height: 100dvh;
  display: grid;
  grid-template-columns: minmax(0, 0.96fr) minmax(0, 1.04fr);
  grid-template-rows: auto 1fr auto;
  padding: 0 max(28px, calc((100vw - 1280px) / 2));
  background: #f7f7fb;
  color: var(--ink);
  font-family:
    'Helvetica Neue', 'Hiragino Kaku Gothic ProN', 'Yu Gothic', sans-serif;
  font-size: 16px;
  line-height: 1.7;
  -webkit-font-smoothing: antialiased;
}
.admin-portal :where(h1, h2, h3, p) {
  margin: 0;
}
.admin-portal :where(button, a, summary) {
  -webkit-tap-highlight-color: transparent;
}
.admin-portal :where(a, button, summary):focus-visible {
  outline: 3px solid #1769c2;
  outline-offset: 5px;
}
.admin-portal :where(button, a) {
  transition:
    background 160ms ease,
    border-color 160ms ease,
    color 160ms ease;
}
.admin-portal button:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}
.admin-portal svg {
  flex-shrink: 0;
}
.skip-link {
  position: fixed;
  z-index: 5;
  top: 10px;
  left: 10px;
  padding: 12px 20px;
  background: #fff;
  transform: translateY(-150%);
}
.skip-link:focus {
  transform: translateY(0);
}
.portal-header {
  grid-column: 1 / -1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  min-height: 108px;
}
.brand {
  display: inline-flex;
  width: fit-content;
  align-items: center;
  gap: 12px;
  color: var(--ink);
  font-size: 20px;
  font-weight: 800;
  line-height: 1.1;
  letter-spacing: 0.06em;
  text-decoration: none;
}
.brand-sub {
  display: block;
  margin-top: 7px;
  color: var(--muted);
  font-size: 12px;
  font-weight: 500;
  letter-spacing: 0.12em;
}
.brand-symbol {
  display: grid;
  grid-template-columns: repeat(2, 13px);
  grid-template-rows: repeat(2, 13px);
  gap: 4px;
}
.brand-symbol i {
  background: var(--ink);
  border-radius: 3px;
}
.brand-symbol i:nth-child(2) {
  border-radius: 50%;
  background: #a4a5db;
}
.brand-symbol i:nth-child(3) {
  background: #e9afa6;
}
.story-panel {
  display: flex;
  flex-direction: column;
  min-width: 0;
  padding: clamp(32px, 4vw, 60px);
  background: #eeedf8;
  border: 1px solid #e0dfed;
  border-right: 0;
  border-radius: 24px 0 0 24px;
}
.story-content {
  margin: auto 0;
}
.section-label {
  display: flex;
  align-items: center;
  gap: 9px;
  color: #616080;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.11em;
}
.section-label > span {
  width: 6px;
  height: 6px;
  border-radius: 2px;
  background: #7876b7;
}
.story-content h2 {
  margin-top: 24px;
  font-size: clamp(34px, 3.5vw, 48px);
  font-weight: 700;
  letter-spacing: -0.055em;
  line-height: 1.55;
}
.story-content em {
  color: #656198;
  font-style: normal;
}
.story-description {
  margin-top: 20px;
  color: var(--muted);
  font-size: 16px;
  line-height: 1.95;
}
.console-map {
  margin-top: 36px;
  border: 1px solid #deddec;
  border-radius: 16px;
  background: #f9f9fe;
  box-shadow: 0 8px 22px -16px #35355530;
  overflow: hidden;
}
.console-map-heading {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 19px 20px;
  border-bottom: 1px solid #e7e6f1;
  background: #fff;
}
.console-symbol {
  display: grid;
  place-items: center;
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  border-radius: 11px;
  background: var(--ink);
  color: #fff;
}
.map-eyebrow {
  display: block;
  color: var(--muted);
  font-size: 12px;
  letter-spacing: 0.07em;
}
.console-map h3 {
  font-size: 14px;
  font-weight: 600;
  line-height: 1.6;
}
.workspace-tag {
  margin-left: auto;
  padding: 3px 8px;
  border-radius: 5px;
  color: #5c5a79;
  background: #eeedf8;
  font-size: 12px;
  white-space: nowrap;
}
.capability-list {
  list-style: none;
  margin: 0;
  padding: 4px 20px;
}
.capability-list li {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 0;
}
.capability-list li + li {
  border-top: 1px solid #e7e6f1;
}
.capability-list p {
  margin-top: 3px;
  color: var(--muted);
  font-size: 12px;
  line-height: 1.6;
}
.capability-icon {
  display: grid;
  place-items: center;
  flex-shrink: 0;
  width: 34px;
  height: 34px;
  border-radius: 9px;
}
.capability-icon svg {
  width: 17px;
  height: 17px;
}
.access-icon {
  color: #7c554d;
  background: #f7e4dd;
}
.identity-icon {
  color: #4e6540;
  background: #e5edda;
}
.session-icon {
  color: #615e91;
  background: #e8e6f5;
}
.capability-index {
  margin-left: auto;
  color: #69687d;
  font-size: 12px;
  font-variant-numeric: tabular-nums;
}
.map-note {
  padding: 12px 20px 16px;
  color: var(--muted);
  font-size: 12px;
  line-height: 1.8;
}
.story-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-top: 36px;
  padding-top: 20px;
  border-top: 1px solid #dad9e9;
  color: #65667e;
  font-size: 12px;
  line-height: 1.8;
}
.story-footer > span > span {
  display: block;
}
.edition {
  font-size: 18px;
  font-weight: 600;
  letter-spacing: -0.04em;
}
.workspace-panel {
  display: flex;
  flex-direction: column;
  min-width: 0;
  padding: 48px clamp(32px, 4vw, 64px);
  background: #fff;
  border: 1px solid #e0dfed;
  border-left: 0;
  border-radius: 0 24px 24px 0;
}
.workspace-header {
  display: flex;
  gap: 28px;
  align-items: center;
  font-size: 12px;
}
.portal-label {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 6px 12px;
  border: 1px solid #dedfe9;
  border-radius: 20px;
  color: var(--muted);
}
.portal-label svg {
  width: 14px;
  height: 14px;
}
.participant-link {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 44px;
  text-decoration: none;
  color: var(--muted);
}
.participant-link:hover {
  color: var(--blue);
}
.participant-link svg {
  width: 16px;
}
.auth-content {
  width: min(100%, 420px);
  margin: auto;
  padding: 12px 0;
  outline: none;
}
.login-emblem {
  display: grid;
  place-items: center;
  width: 48px;
  height: 48px;
  margin-bottom: 22px;
  border: 1px solid #e3e3f0;
  border-radius: 14px;
  color: #646093;
  background: #f4f3fb;
}
.login-emblem svg {
  width: 22px;
  height: 22px;
}
.progress {
  display: flex;
  list-style: none;
  padding: 0;
  margin: 0 0 38px;
  gap: 0;
}
.progress li {
  position: relative;
  display: flex;
  align-items: center;
  gap: 7px;
  color: #6d7880;
  font-size: 12px;
  white-space: nowrap;
}
.progress li:not(:last-child) {
  flex: 1;
}
.progress li:not(:last-child)::after {
  content: '';
  height: 1px;
  flex: 1;
  margin: 0 12px;
  background: var(--line);
}
.step-number {
  display: grid;
  place-items: center;
  flex-shrink: 0;
  width: 24px;
  height: 24px;
  border: 1px solid #dce3e8;
  border-radius: 50%;
  font-size: 10px;
  line-height: 1;
}
.step-number svg {
  width: 13px;
  height: 13px;
}
.progress .current {
  color: var(--blue);
  font-weight: 700;
}
.current .step-number {
  color: #fff;
  background: var(--blue);
  border-color: var(--blue);
}
.complete .step-number {
  color: var(--blue);
  background: #edf4fc;
  border-color: #edf4fc;
}
.login-section .section-label {
  font-size: 12px;
  letter-spacing: 0.13em;
}
.admin-portal h1 {
  margin: 10px 0 0;
  font-size: clamp(28px, 2.5vw, 34px);
  letter-spacing: -0.045em;
  line-height: 1.55;
  font-weight: 700;
}
.intro {
  margin-top: 16px;
  color: var(--muted);
  font-size: 16px;
  line-height: 1.9;
}
.google-button,
.primary-button,
.secondary-button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  width: 100%;
  min-height: 56px;
  border-radius: 10px;
  font-size: 16px;
  font-weight: 600;
  text-decoration: none;
}
.google-button {
  margin-top: 30px;
  padding: 15px 18px;
  color: var(--ink);
  background: #fff;
  border: 1px solid #a5aec1;
  box-shadow: 0 2px 3px #22263d06;
}
.google-button > svg:last-child {
  margin-left: auto;
  width: 17px;
}
.google-button > svg:first-child {
  margin-right: auto;
}
.google-button:hover {
  background: #f6f9fc;
  border-color: var(--blue);
}
.primary-button {
  margin-top: 24px;
  padding: 14px;
  color: #fff;
  background: var(--blue);
  border: 1px solid var(--blue);
}
.primary-button:hover:not(:disabled) {
  background: #1157a4;
}
.secondary-button {
  margin-top: 24px;
  padding: 14px;
  color: var(--ink);
  background: #fff;
  border: 1px solid #b9c7d2;
}
.secondary-button:hover:not(:disabled) {
  background: #f3f7fb;
}
.secure-note {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  margin-top: 13px;
  color: #677681;
  font-size: 12px;
  line-height: 1.7;
}
.secure-note svg {
  width: 13px;
  height: 13px;
}
.first-visit {
  display: flex;
  gap: 13px;
  padding: 20px;
  margin-top: 30px;
  border: 1px solid #e7e7ef;
  border-radius: 12px;
  background: #f8f8fc;
}
.small-icon {
  color: #567289;
  padding-top: 2px;
}
.small-icon svg {
  width: 18px;
}
.first-visit h2 {
  font-size: 14px;
  font-weight: 600;
}
.first-visit p {
  margin-top: 7px;
  color: var(--muted);
  font-size: 12px;
  line-height: 1.9;
}
.help-details {
  margin-top: 19px;
  font-size: 12px;
  color: #5a6b78;
}
.help-details summary {
  cursor: pointer;
  padding: 8px 0;
  width: fit-content;
}
.help-details summary:hover {
  color: var(--blue);
}
.help-content {
  padding: 8px 0;
}
.help-content p + p {
  margin-top: 10px;
}
.workspace-footer {
  grid-column: 1 / -1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  padding: 24px 4px;
  color: var(--muted);
  font-size: 12px;
}
.workspace-footer > span {
  font-size: 12px;
  letter-spacing: 0.1em;
  white-space: nowrap;
}
.workspace-footer p {
  text-align: right;
}
.mobile-break {
  display: none;
}
.state-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 10px;
  color: #426480;
  background: #edf4fa;
  border-radius: 5px;
  font-size: 12px;
}
.state-badge svg {
  width: 15px;
  height: 15px;
}
.state-badge.approved {
  color: #28604a;
  background: #edf6ef;
}
.state-badge.pending {
  color: #7a561a;
  background: #fbf4e4;
}
.admin-portal .state-title {
  font-size: 29px;
}
.account-card {
  display: flex;
  align-items: center;
  gap: 13px;
  margin-top: 24px;
  padding: 17px;
  border: 1px solid var(--line);
  border-radius: 8px;
}
.account-card > div {
  min-width: 0;
}
.account-card strong,
.request-identity strong {
  display: block;
  overflow-wrap: anywhere;
  font-size: 14px;
  font-weight: 600;
}
.account-avatar {
  flex-shrink: 0;
  display: grid;
  place-items: center;
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background: #eef3f8;
  color: #426480;
  font-weight: 600;
}
.meta-label {
  display: block;
  color: var(--muted);
  font-size: 12px;
  margin-bottom: 2px;
}
.request-meta {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 12px;
  margin: 18px 0 0;
}
.request-meta dt {
  color: var(--muted);
  font-size: 12px;
}
.request-meta dd {
  margin: 3px 0 0;
  font-size: 14px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}
.device-note {
  display: flex;
  gap: 10px;
  margin-top: 24px;
  padding: 17px 0;
  border-top: 1px solid var(--line);
  color: var(--muted);
  font-size: 12px;
}
.device-note svg {
  width: 16px;
  margin-top: 3px;
}
.live-dot {
  width: 5px;
  height: 5px;
  flex-shrink: 0;
  border-radius: 50%;
  background: #618568;
}
.text-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  min-height: 44px;
  padding: 6px 0;
  border: 0;
  background: transparent;
  color: #46637a;
  font-size: 12px;
  text-decoration: underline;
  text-underline-offset: 4px;
}
.text-button:hover:not(:disabled) {
  color: var(--blue);
}
.text-button svg {
  width: 15px;
  height: 15px;
}
.session-actions {
  margin-top: 23px;
  border-top: 1px solid var(--line);
  padding-top: 12px;
}
.logout-confirmation {
  font-size: 13px;
}
.logout-confirmation .text-button + .text-button {
  margin-left: 22px;
}
.notice-message,
.error-message,
.configuration-note {
  padding: 14px 16px;
  margin-bottom: 22px;
  border-radius: 7px;
  font-size: 13px;
  line-height: 1.8;
}
.notice-message {
  display: flex;
  align-items: start;
  gap: 9px;
  background: #eff5fa;
  color: #385b78;
}
.notice-message svg {
  width: 17px;
  margin-top: 2px;
}
.error-message {
  border: 1px solid #ecd0c9;
  color: #8e3728;
  background: #fff6f3;
}
.error-message .text-button {
  color: #8e3728;
}
.oauth-error {
  margin-top: 24px;
}
.configuration-note {
  margin: 15px 0 0;
  background: #fbf5e9;
  color: #765725;
}
.loading-state {
  padding: 28px 0;
}
.admin-portal .loading-state h1 {
  font-size: 22px;
}
.loading-state p {
  margin-top: 14px;
  font-size: 14px;
  color: var(--muted);
}
.spinner {
  display: inline-block;
  width: 20px;
  height: 20px;
  border: 2px solid #d6e2eb;
  border-top-color: var(--blue);
  border-radius: 50%;
  animation: rotate 850ms linear infinite;
}
@keyframes rotate {
  to {
    transform: rotate(360deg);
  }
}
.session-expiry {
  margin-top: 10px;
  color: var(--muted);
  font-size: 12px;
}
.approval-inbox {
  margin-top: 30px;
}
.inbox-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.inbox-heading h2 {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
}
.inbox-heading h2 span {
  display: grid;
  place-items: center;
  min-width: 22px;
  height: 22px;
  padding: 0 5px;
  border-radius: 5px;
  color: var(--blue);
  background: #edf4fa;
  font-size: 12px;
}
.icon-button {
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  background: #fff;
  color: #567084;
  border: 1px solid var(--line);
  border-radius: 6px;
}
.icon-button:hover:not(:disabled) {
  background: #f3f7fb;
}
.icon-button svg {
  width: 17px;
}
.inbox-description {
  margin-top: 8px;
  color: var(--muted);
  font-size: 12px;
}
.empty-inbox {
  display: grid;
  justify-items: center;
  gap: 7px;
  margin-top: 18px;
  padding: 25px 12px;
  background: #f7faf8;
  border: 1px solid #e1e9e3;
  border-radius: 8px;
  text-align: center;
}
.empty-icon {
  color: #5e8771;
}
.empty-inbox strong {
  font-size: 13px;
  font-weight: 500;
}
.empty-inbox p {
  font-size: 12px;
  color: var(--muted);
}
.request-list {
  list-style: none;
  margin: 15px 0 0;
  padding: 0;
}
.request-list > li {
  border: 1px solid var(--line);
  border-radius: 8px;
  padding: 16px;
  margin-top: 10px;
}
.request-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 12px;
}
.small-button {
  min-height: 44px;
  padding: 7px 14px;
  border: 1px solid #c7d3dc;
  border-radius: 5px;
  background: #fff;
  color: #4c6070;
  font-size: 12px;
}
.small-button:hover:not(:disabled) {
  background: #f0f5fa;
}
.approve-button {
  color: #fff;
  border-color: var(--blue);
  background: var(--blue);
}
.approve-button:hover:not(:disabled) {
  background: #1157a4;
}
.decision-confirmation p {
  margin-top: 12px;
  font-size: 13px;
}
@media (max-width: 1100px) {
  .admin-portal {
    padding-inline: 24px;
  }
  .story-panel,
  .workspace-panel {
    padding: 32px;
  }
  .workspace-tag,
  .capability-index {
    display: none;
  }
  .console-map-heading {
    padding-inline: 16px;
  }
  .capability-list {
    padding-inline: 16px;
  }
  .first-visit {
    padding: 18px 15px;
  }
  .first-visit br {
    display: none;
  }
}
@media (max-width: 820px) {
  .admin-portal {
    grid-template-columns: minmax(0, 1fr);
    grid-template-rows: auto auto 1fr auto;
    padding-inline: 24px;
  }
  .portal-header {
    min-height: 92px;
  }
  .brand {
    font-size: 18px;
  }
  .portal-label {
    display: none;
  }
  .story-panel {
    padding: 25px 32px;
    border-right: 1px solid #e0dfed;
    border-bottom: 0;
    border-radius: 20px 20px 0 0;
  }
  .story-content h2 {
    margin: 0;
    font-size: 24px;
    letter-spacing: -0.04em;
  }
  .story-content h2 br {
    display: none;
  }
  .story-content .section-label,
  .story-description,
  .console-map,
  .story-footer {
    display: none;
  }
  .workspace-panel {
    padding: 32px;
    border-left: 1px solid #e0dfed;
    border-top: 0;
    border-radius: 0 0 20px 20px;
  }
  .auth-content {
    padding: 0;
  }
  .login-emblem {
    display: none;
  }
  .progress {
    margin-bottom: 30px;
  }
  .mobile-break {
    display: initial;
  }
  .workspace-footer {
    padding-block: 20px;
  }
}
@media (max-width: 480px) {
  .admin-portal {
    padding-inline: 16px;
  }
  .portal-header {
    gap: 14px;
    min-height: 88px;
  }
  .brand {
    gap: 9px;
    font-size: 16px;
  }
  .brand-sub {
    font-size: 12px;
    letter-spacing: 0.025em;
  }
  .brand-symbol {
    grid-template-columns: repeat(2, 10px);
    grid-template-rows: repeat(2, 10px);
    gap: 3px;
  }
  .participant-link {
    max-width: 106px;
    gap: 5px;
    line-height: 1.6;
  }
  .story-panel {
    padding: 22px;
  }
  .story-content h2 {
    font-size: 21px;
  }
  .workspace-panel {
    padding: 28px 22px;
  }
  .admin-portal h1 {
    font-size: 28px;
  }
  .admin-portal .state-title {
    font-size: 25px;
  }
  .progress li {
    gap: 5px;
  }
  .progress li:not(:last-child)::after {
    margin: 0 7px;
  }
  .first-visit {
    gap: 9px;
    padding: 17px 12px;
  }
  .workspace-footer {
    flex-direction: column;
    align-items: start;
    gap: 6px;
  }
  .workspace-footer p {
    text-align: left;
  }
}
@media (max-width: 360px) {
  .admin-portal {
    padding-inline: 12px;
  }
  .story-panel,
  .workspace-panel {
    padding-inline: 16px;
  }
  .story-content h2 {
    font-size: 19px;
  }
  .progress li {
    gap: 4px;
  }
  .progress li:not(:last-child)::after {
    margin-inline: 5px;
  }
  .desktop-break {
    display: none;
  }
}
@media (prefers-reduced-motion: reduce) {
  .admin-portal *,
  .admin-portal *::before,
  .admin-portal *::after {
    animation: none !important;
    transition: none !important;
  }
}
</style>
