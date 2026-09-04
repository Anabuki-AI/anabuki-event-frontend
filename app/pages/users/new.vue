<script setup lang="ts">
import RegistrationForm from '~/pages/RegistrationForm.vue'

useSeoMeta({
  title: 'ユーザー登録',
  description: 'Anabuki Eventのユーザー登録ページです。',
})
</script>

<template>
  <section class="form-card quiz-page">
    <header class="quiz-header">
      <p class="quiz-header-title">クイズ大会</p>
      <p class="eyebrow">
        Create account
      </p>
      <h1>ユーザー登録</h1>
      <p class="muted-copy">
        ニックネームとアンケートの入力だけで参加登録できます。
      </p>
    </header>
    <main class="page-shell">
      <RegistrationForm />
    </main>
  </section>
</template>
