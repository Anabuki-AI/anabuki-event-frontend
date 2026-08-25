<script setup lang="ts">
import AdminGoogleLoginPanel from '~/features/admin-auth/components/AdminGoogleLoginPanel.vue'

useSeoMeta({
  title: '管理者ログイン',
  description: 'Anabuki Eventの管理者向けGoogleログインページです。',
})
</script>

<template>
  <main class="admin-login-page">
    <div class="admin-login-layout">
      <section class="admin-login-intro" aria-labelledby="admin-login-intro-title">
        <NuxtLink class="admin-login-brand" to="/" aria-label="Anabuki Event ホームへ戻る">
          <span class="admin-login-brand__mark" aria-hidden="true">A</span>
          <span>Anabuki Event</span>
        </NuxtLink>

        <div class="admin-login-intro__body">
          <p class="admin-login-intro__eyebrow">For event administrators</p>
          <h1 id="admin-login-intro-title">イベント運営を、<br>安全に始める。</h1>
          <p>
            管理者専用の入口です。Google OAuth接続後、環境設定者・管理ページ利用者・申請者の権限をサーバーで判定します。
          </p>
        </div>

        <ul class="admin-login-points">
          <li>
            <span class="admin-login-points__icon" aria-hidden="true">✓</span>
            <span>Google本人確認後、管理ページ利用者または申請者として安全に開始できます</span>
          </li>
          <li>
            <span class="admin-login-points__icon" aria-hidden="true">✓</span>
            <span>管理者用サブドメインからの公開を予定しています</span>
          </li>
        </ul>
      </section>

      <AdminGoogleLoginPanel />
    </div>

    <p class="admin-login-footer">
      Google OAuthの認証情報はバックエンドだけで処理し、ブラウザにはセッションCookieだけを発行します。
    </p>
  </main>
</template>
