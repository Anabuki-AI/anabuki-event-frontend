<script setup lang="ts">
import ParticipantRegistrationForm from '~/features/participants/components/ParticipantRegistrationForm.vue'

useSeoMeta({
  title: '参加登録',
  description: 'Anabuki Eventの参加登録ページです。',
})
</script>

<template>
  <section class="form-card quiz-page">
    <header class="quiz-header">
      <p class="quiz-header-title">クイズ大会</p>
      <p class="eyebrow">
        Join the event
      </p>
      <NuxtLink
        class="help-button"
        to="/participants/help"
        target="_blank"
        rel="noopener"
      >
        ヘルプ
      </NuxtLink>
    </header>
    <main class="page-shell">
      <ParticipantRegistrationForm />
    </main>
  </section>
</template>
