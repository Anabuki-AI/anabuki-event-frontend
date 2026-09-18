<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useParticipantQuizState } from '~/features/participant-quiz/composables/use-participant-quiz-state'
import { deleteParticipantSession } from '~/features/participants/api/delete-participant-session'
import { getCurrentParticipant } from '~/features/participants/api/get-current-participant'
import { useParticipantPresence } from '~/features/participants/composables/use-participant-presence'
import type { Participant } from '~/features/participants/types'
import { reactionOptions } from '~/features/waiting/components/ReactionButton'
import { setupWaitingRoom } from '~/features/waiting/components/WaitingRoom'
import { ApiError } from '~/lib/api/error'

useSeoMeta({
  title: '待機画面',
  description: 'Anabuki Eventのイベント待機画面です。',
})

const participant = ref<Participant>()
const participantError = ref('')
const isRedirecting = ref(false)
const isLoggingOut = ref(false)
const logoutError = ref('')

async function handleLogout() {
  if (isLoggingOut.value) return
  isLoggingOut.value = true
  logoutError.value = ''
  try {
    await deleteParticipantSession()
  }
  catch (error) {
    // 401/403 はすでにログアウト済みなので登録へ進んでよい
    if (!(error instanceof ApiError) || ![401, 403].includes(error.statusCode ?? 0)) {
      isLoggingOut.value = false
      logoutError.value = 'ログアウトできませんでした。通信状況を確認して再度お試しください。'
      return
    }
  }
  await navigateTo('/participants/new')
}

function redirectToRegistration() {
  if (isRedirecting.value) return
  isRedirecting.value = true
  void navigateTo('/participants/new')
}

function redirectToAnswer() {
  if (isRedirecting.value) return
  isRedirecting.value = true
  void navigateTo('/users/answer')
}

const { state, isLoading, loadError } = useParticipantQuizState({
  onState: (nextState) => {
    if (nextState.status === 'in_progress' && nextState.phase !== null && nextState.question !== null) {
      redirectToAnswer()
    }
  },
  onError: (error) => {
    if (error instanceof ApiError && error.statusCode === 401) redirectToRegistration()
  },
})

const waitingMessage = computed(() => {
  if (isLoading.value && !state.value) return 'クイズの状態を確認しています…'
  if (state.value?.status === 'finished') return 'クイズ大会は終了しました。ご参加ありがとうございました。'
  if (state.value?.status === 'in_progress') return '次の問題の公開をお待ちください。'
  return 'クイズ大会の開始をお待ちください。'
})

const { participantCount, totalParticipantCount } = useParticipantPresence()
const { isCountUpdated, lastReactedEmoji, handleReact } = setupWaitingRoom(participantCount)

onMounted(async () => {
  try {
    participant.value = await getCurrentParticipant()
  }
  catch (error) {
    if (error instanceof ApiError && error.statusCode === 401) {
      redirectToRegistration()
      return
    }
    participantError.value = '参加情報を確認できませんでした。通信状況を確認して再読み込みしてください。'
  }
})
</script>

<template>
  <main class="page-shell">
    <section
      class="form-card waiting-card quiz-page"
      :aria-busy="!participant && !participantError"
    >
      <span v-if="!participant && !participantError" class="visually-hidden" role="status">
        参加情報を確認しています…
      </span>
      <div class="waiting-header">
        <div class="waiting-user">
          <p class="quiz-header-title">
            クイズ大会
          </p>
          <p class="eyebrow-main">
            Waiting room
          </p>
          <div class="waiting-user-row">
            <p class="waiting-user-name">
              {{ participant?.displayName ?? '参加者' }} さん
            </p>
          </div>
        </div>
        <div class="waiting-header-actions">
          <NuxtLink
            class="help-button"
            to="/participants/help"
          >
            ヘルプ
          </NuxtLink>
          <button
            type="button"
            class="help-button"
            :disabled="isLoggingOut"
            @click="handleLogout"
          >
            {{ isLoggingOut ? 'ログアウト中…' : 'ログアウト' }}
          </button>
        </div>
      </div>

      <p v-if="logoutError" class="status-message error" role="alert">
        {{ logoutError }}
      </p>

      <p v-if="participantError" class="status-message error" role="alert">
        {{ participantError }}
      </p>
      <p v-if="loadError && !(loadError instanceof ApiError && loadError.statusCode === 401)" class="status-message error" role="alert">
        クイズの最新状態を取得できませんでした。自動的に再試行します。
      </p>

      <div class="participant-panel" aria-live="polite">
        <p class="participant-label">
          {{ waitingMessage }}
        </p>
      </div>

      <div class="participant-panel">
        <p class="participant-label">
          参加人数
        </p>
        <p class="participant-count" :class="{ 'is-updated': isCountUpdated }">
          {{ participantCount ?? '—' }} / {{ totalParticipantCount ?? '—' }}
          <span class="participant-unit">人</span>
        </p>
      </div>

      <p class="waiting-note">
        <span class="waiting-note-line">この画面を閉じずにお待ちください。</span>
        <span class="waiting-note-line waiting-note-emphasis">問題が公開されると、画面が自動的に切り替わります。</span>
      </p>

      <div class="reaction-section">
        <h2 class="reaction-title">
          リアクション
        </h2>
        <div class="reaction-bar">
          <button
            v-for="option in reactionOptions"
            :key="option.emoji"
            type="button"
            class="reaction-button"
            :class="{ 'is-reacted': lastReactedEmoji === option.emoji }"
            :aria-label="`${option.label}リアクションを送る`"
            @click="handleReact(option.emoji)"
          >
            <span class="reaction-emoji" aria-hidden="true">{{ option.emoji }}</span>
          </button>
        </div>
      </div>
    </section>
  </main>
</template>
