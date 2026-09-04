<script setup lang="ts">
import RegistrationForm from '~/pages/RegistrationForm.vue'

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
          ニックネームとアンケートの入力だけで参加登録できます。
        </p>
      </div>
      <RegistrationForm />
    </section>
  </main>
</template>
