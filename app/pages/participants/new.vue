<script setup lang="ts">
import ParticipantRegistrationForm from '~/features/participants/components/ParticipantRegistrationForm.vue'

useSeoMeta({
  title: '参加登録',
  description: 'Anabuki Eventの参加登録ページです。',
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
          Join the event
        </p>
        <h1>参加登録</h1>
        <p class="muted-copy">
          表示名とアンケートを入力して、クイズ大会に参加します。
        </p>
      </div>
      <ParticipantRegistrationForm />
    </section>
  </main>
</template>
