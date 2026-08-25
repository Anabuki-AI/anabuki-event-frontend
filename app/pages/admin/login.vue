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
            管理者専用の入口です。Google OAuth接続後は、許可された個別メールアドレスを確認して管理画面へ進める予定です。
          </p>
        </div>

        <ul class="admin-login-points">
          <li>
            <span class="admin-login-points__icon" aria-hidden="true">✓</span>
            <span>管理者として許可されたアカウントのみを対象にします</span>
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
      Google OAuth接続前のプレビュー画面です。認証情報はこの画面では送信されません。
    </p>
  </main>
</template>
