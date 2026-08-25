<script setup lang="ts">
import { request } from '~/lib/api/client'

const isOAuthConfigured = ref(false)
const isLoading = ref(true)
const statusError = ref('')

onMounted(async () => {
  try {
    const status = await request<{ configured: boolean }>('/auth/google/status')
    isOAuthConfigured.value = status.configured
  }
  catch {
    statusError.value = '認証サービスの状態を確認できません。バックエンドの設定を確認してください。'
  }
  finally {
    isLoading.value = false
  }
})

function startGoogleLogin() {
  if (!isOAuthConfigured.value) return
  const config = useRuntimeConfig()
  window.location.assign(`${config.public.apiBase}/auth/google/start`)
}
</script>

<template>
  <section class="admin-login-card" aria-labelledby="admin-login-title">
    <div class="admin-login-card__header">
      <div class="google-mark" aria-hidden="true">
        <svg viewBox="0 0 24 24" role="presentation">
          <path fill="#4285F4" d="M21.35 12.23c0-.78-.07-1.53-.22-2.23H12v4.22h5.24a4.48 4.48 0 0 1-1.94 2.94v2.45h3.14c1.84-1.69 2.91-4.18 2.91-7.38Z" />
          <path fill="#34A853" d="M12 21.75c2.63 0 4.84-.87 6.45-2.37l-3.14-2.45c-.87.58-1.98.92-3.31.92-2.54 0-4.7-1.72-5.47-4.03H3.29v2.53A9.75 9.75 0 0 0 12 21.75Z" />
          <path fill="#FBBC05" d="M6.53 13.82A5.86 5.86 0 0 1 6.22 12c0-.63.11-1.24.31-1.82V7.65H3.29A9.75 9.75 0 0 0 2.25 12c0 1.57.38 3.06 1.04 4.35l3.24-2.53Z" />
          <path fill="#EA4335" d="M12 6.15c1.43 0 2.71.49 3.72 1.45l2.79-2.79C16.84 3.25 14.63 2.25 12 2.25a9.75 9.75 0 0 0-8.71 5.4l3.24 2.53c.77-2.31 2.93-4.03 5.47-4.03Z" />
        </svg>
      </div>
      <div>
        <p class="admin-login-card__label">Administrator sign in</p>
        <h2 id="admin-login-title">管理者ログイン</h2>
      </div>
    </div>

    <p class="admin-login-card__copy">
      イベントの作成や運営に使用する管理者専用画面です。許可されたGoogleアカウントでログインしてください。
    </p>

    <div class="oauth-status" :class="{ 'oauth-status--ready': isOAuthConfigured }" role="status">
      <span class="oauth-status__icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" role="presentation">
          <path d="M12 3 4.5 6v5.25c0 4.64 3.2 8.97 7.5 9.75 4.3-.78 7.5-5.11 7.5-9.75V6L12 3Zm0 4.2 4.5 1.8v2.25c0 3.28-2.11 6.56-4.5 7.45-2.39-.89-4.5-4.17-4.5-7.45V9L12 7.2Z" />
        </svg>
      </span>
      <span>
        <strong v-if="isLoading">Google OAuthの設定を確認中です</strong>
        <strong v-else-if="isOAuthConfigured">Google OAuthを利用できます</strong>
        <strong v-else>Google OAuthは利用できません</strong>
        <small v-if="statusError">{{ statusError }}</small>
        <small v-else-if="!isLoading && !isOAuthConfigured">必要な環境変数がバックエンドに設定されるまでログインは開始されません。</small>
        <small v-else-if="!isLoading">設定済みのGoogle OAuthへ安全に移動します。</small>
      </span>
    </div>

    <button class="google-login-button" type="button" :disabled="isLoading || !isOAuthConfigured" @click="startGoogleLogin">
      <span class="google-login-button__logo" aria-hidden="true">G</span>
      <span>Googleでログイン</span>
    </button>

    <p class="admin-login-card__notice">
      クライアントシークレットやトークンはブラウザへ渡しません。ログイン後はサーバーサイドセッションを使用します。
    </p>
  </section>
</template>
