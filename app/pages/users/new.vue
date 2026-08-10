<script setup lang="ts">
import UserCreateForm from '~/features/users/components/UserCreateForm.vue'

useSeoMeta({
  title: 'ユーザー登録',
  description: 'Anabuki Eventのユーザー登録ページです。',
})
</script>

<template>
  <main class="page-shell">
    <section class="form-card">
      <NuxtLink class="back-link" to="/">
        ← ホームへ戻る
      </NuxtLink>
      <div>
        <p class="eyebrow">
          Create account
        </p>
        <h1>ユーザー登録</h1>
        <p class="muted-copy">
          Javalinのユーザー登録APIへ接続する最初の縦切り機能です。
        </p>
      </div>
      <UserCreateForm />
    </section>
  </main>
</template>
