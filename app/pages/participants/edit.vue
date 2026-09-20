<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { getCurrentParticipant } from '~/features/participants/api/get-current-participant'
import { updateParticipantName } from '~/features/participants/api/update-participant-name'
import type { Participant } from '~/features/participants/types'
import { validateDisplayName } from '~/features/participants/validation'
import { toApiError } from '~/lib/api/error'

useSeoMeta({
  title: '名前の編集',
  description: '参加者名を編集する画面です。',
})

const participant = ref<Participant>()
const displayName = ref('')
const isLoading = ref(true)
const isSubmitting = ref(false)
const showError = ref(false)
const loadError = ref('')
const submitError = ref('')
const displayNameError = computed(() => validateDisplayName(displayName.value))

async function loadParticipant() {
  try {
    participant.value = await getCurrentParticipant()
    displayName.value = participant.value.displayName
  }
  catch (error) {
    const apiError = toApiError(error)
    if (apiError.statusCode === 401) {
      await navigateTo('/participants/new')
      return
    }
    loadError.value = '参加情報を確認できませんでした。再読み込みしてください。'
  }
  finally {
    isLoading.value = false
  }
}

async function handleSubmit() {
  showError.value = true
  if (!participant.value || displayNameError.value || isSubmitting.value) return

  isSubmitting.value = true
  submitError.value = ''
  try {
    await updateParticipantName(displayName.value.trim())
    await navigateTo('/participants/waiting')
  }
  catch (error) {
    const apiError = toApiError(error)
    if (apiError.statusCode === 401) {
      await navigateTo('/participants/new')
      return
    }
    submitError.value = apiError.message
  }
  finally {
    isSubmitting.value = false
  }
}

onMounted(loadParticipant)
</script>

<template>
  <main class="page-shell">
    <section class="form-card quiz-page">
      <header class="quiz-header">
        <p class="quiz-header-title">クイズ大会</p>
        <p class="eyebrow">Edit participant name</p>
      </header>

      <div v-if="isLoading" class="participant-panel" role="status">
        参加情報を確認しています…
      </div>
      <p v-else-if="loadError" class="status-message error" role="alert">
        {{ loadError }}
      </p>
      <form v-else class="user-form" novalidate @submit.prevent="handleSubmit">
        <h1>名前を編集</h1>
        <label>
          <span>表示名</span>
          <input
            v-model.trim="displayName"
            type="text"
            name="displayName"
            autocomplete="nickname"
            maxlength="100"
            :aria-invalid="Boolean(showError && displayNameError)"
            aria-describedby="display-name-note"
          >
          <p
            v-if="showError && displayNameError"
            id="display-name-note"
            class="field-note is-error"
            role="alert"
          >
            {{ displayNameError }}
          </p>
        </label>
        <p v-if="submitError" class="status-message error" role="alert">
          {{ submitError }}
        </p>
        <button
          type="submit"
          class="submit-button"
          :disabled="isSubmitting"
        >
          {{ isSubmitting ? '保存中…' : '保存する' }}
        </button>
        <NuxtLink class="back-link" to="/participants/waiting">
          待機画面へ戻る
        </NuxtLink>
      </form>
    </section>
  </main>
</template>
