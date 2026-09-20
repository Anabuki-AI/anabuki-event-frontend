<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { getCurrentParticipant } from '~/features/participants/api/get-current-participant'
import ParticipantPageLayout from '~/features/participants/components/ParticipantPageLayout.vue'
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
  <ParticipantPageLayout eyebrow="Join the event">
    <div v-if="isCheckingParticipant" class="participant-panel" role="status">
      参加状態を確認しています…
    </div>
    <p v-else-if="guardError" class="status-message error" role="alert">
      {{ guardError }}
    </p>
    <ParticipantRegistrationForm v-else />
  </ParticipantPageLayout>
</template>
