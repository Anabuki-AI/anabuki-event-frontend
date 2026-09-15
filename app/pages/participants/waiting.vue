<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { getCurrentParticipant } from '~/features/participants/api/get-current-participant'
import type { Participant } from '~/features/participants/types'
import type { ReactionOption } from '~/features/waiting/types'

useSeoMeta({
  title: '待機画面',
  description: 'Anabuki Eventのイベント待機画面です。',
})

const reactionOptions: ReactionOption[] = [
  { emoji: '👏', label: '拍手' },
  { emoji: '🎉', label: 'わーい' },
  { emoji: '🙌', label: 'いつでも' },
  { emoji: '😂', label: '笑' },
  { emoji: '😢', label: 'かなしい' },
  { emoji: '😲', label: 'おどろき' },
  { emoji: '👍', label: 'いいね' },
  { emoji: '❤️', label: 'ありがとう' },
]

const participant = ref<Participant>()
const participantError = ref('')

onMounted(async () => {
  try {
    participant.value = await getCurrentParticipant()
  }
  catch {
    participantError.value = '参加情報を確認できませんでした。もう一度登録してください。'
    await navigateTo('/participants/new')
  }
})

// デザイン確認用の仮データ。API連携は後の工程で置き換える。
const participantCount = ref(12)
const isCountUpdated = ref(false)
let countTimer: ReturnType<typeof setTimeout> | undefined

watch(participantCount, (next, previous) => {
  if (next <= previous) {
    return
  }
  isCountUpdated.value = false
  requestAnimationFrame(() => {
    isCountUpdated.value = true
    clearTimeout(countTimer)
    countTimer = setTimeout(() => {
      isCountUpdated.value = false
    }, 500)
  })
})

const lastReactedEmoji = ref('')
let reactionTimer: ReturnType<typeof setTimeout> | undefined

function handleReact(emoji: string) {
  lastReactedEmoji.value = emoji
  clearTimeout(reactionTimer)
  reactionTimer = setTimeout(() => {
    lastReactedEmoji.value = ''
  }, 500)
}
</script>

<template>
  <main class="page-shell">
    <p v-if="!participant" class="status-message" role="status">
      {{ participantError || '参加情報を確認しています…' }}
    </p>

    <section v-else class="form-card waiting-card quiz-page">
      <div class="waiting-header">
        <div class="waiting-user">
          <p class="quiz-header-title">クイズ大会</p>
          <p class="eyebrow-main">
            Waiting room
          </p>
          <div class="waiting-user-row">
            <p class="waiting-user-name">
              {{ participant.displayName }} さん
            </p>
          </div>
        </div>
        <NuxtLink
          class="help-button"
          to="/participants/help"
        >
          ヘルプ
        </NuxtLink>
      </div>

      <div class="participant-panel">
        <p class="participant-label">
          参加人数
        </p>
        <p class="participant-count" :class="{ 'is-updated': isCountUpdated }">
          {{ participantCount }}
          <span class="participant-unit">人</span>
        </p>
      </div>

      <p class="waiting-note">
        <span class="waiting-note-line">この画面を閉じずにお待ちください。</span>
        <span class="waiting-note-line waiting-note-emphasis">クイズが開始されると、画面が自動的に切り替わります。</span>
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
