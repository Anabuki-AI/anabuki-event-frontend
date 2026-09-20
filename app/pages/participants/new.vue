<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { getCurrentParticipant } from '~/features/participants/api/get-current-participant'
import ParticipantRegistrationForm from '~/features/participants/components/ParticipantRegistrationForm.vue'
import { ApiError } from '~/lib/api/error'

const isCheckingParticipant = ref(true)
const guardError = ref('')

onMounted(async () => {
  try {
    await getCurrentParticipant()
    await navigateTo('/participants/waiting')
    return
  }
  catch (error) {
    if (!(error instanceof ApiError) || error.statusCode !== 401) {
      guardError.value = '参加状態を確認できませんでした。通信状況を確認して再読み込みしてください。'
    }
  }
  isCheckingParticipant.value = false
})

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
      <div v-if="isCheckingParticipant" class="participant-panel" role="status">
        参加状態を確認しています…
      </div>
      <p v-else-if="guardError" class="status-message error" role="alert">
        {{ guardError }}
      </p>
      <ParticipantRegistrationForm v-else />
    </main>
  </section>
</template>
