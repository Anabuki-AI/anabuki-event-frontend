<script setup lang="ts">
import { ref, watch } from 'vue'
import HelpDialog from './HelpDialog.vue'
import ReactionButton from './ReactionButton.vue'
import type { ReactionOption } from '../types'

const props = defineProps<{
  userName: string
  participantCount: number
  reactions: Record<string, number>
}>()

const emit = defineEmits<{
  react: [emoji: string]
}>()

const reactionOptions: ReactionOption[] = [
  { emoji: '👏', label: '拍手' },
  { emoji: '🎉', label: 'わーい' },
  { emoji: '🙌', label: 'いつでも' },
  { emoji: '😂', label: '笑' },
]

// 参加人数が増えた瞬間だけポップアニメーションを1回鳴らす
const isCountUpdated = ref(false)
let countTimer: ReturnType<typeof setTimeout> | undefined

watch(() => props.participantCount, (next, prev) => {
  if (next <= prev) {
    return
  }
  isCountUpdated.value = false
  // クラス付け外しを1フレーム分空けて再トリガーできるようにする
  requestAnimationFrame(() => {
    isCountUpdated.value = true
    clearTimeout(countTimer)
    countTimer = setTimeout(() => {
      isCountUpdated.value = false
    }, 500)
  })
})

// 押された絵文字だけをバウンドさせる
const lastReactedEmoji = ref('')
let reactionTimer: ReturnType<typeof setTimeout> | undefined

function handleReact(emoji: string) {
  lastReactedEmoji.value = emoji
  emit('react', emoji)
  clearTimeout(reactionTimer)
  reactionTimer = setTimeout(() => {
    lastReactedEmoji.value = ''
  }, 500)
}

const isHelpOpen = ref(false)

function openHelp() {
  isHelpOpen.value = true
}

function closeHelp() {
  isHelpOpen.value = false
}
</script>

<template>
  <section class="form-card waiting-card">
    <div class="waiting-header">
      <div class="waiting-user">
        <p class="eyebrow">
          Waiting room
        </p>
        <p class="waiting-user-name">
          {{ userName }} さん
        </p>
      </div>
      <button
        type="button"
        class="help-button"
        aria-haspopup="dialog"
        @click="openHelp"
      >
        ?
      </button>
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
      この画面を閉じずにお待ちください。クイズが開始されると、画面が自動的に切り替わります。
    </p>

    <div class="reaction-section">
      <h2 class="reaction-title">
        リアクション
      </h2>
      <div class="reaction-bar">
        <ReactionButton
          v-for="option in reactionOptions"
          :key="option.emoji"
          :option="option"
          :count="reactions[option.emoji] ?? 0"
          :is-reacted="lastReactedEmoji === option.emoji"
          @react="handleReact"
        />
      </div>
      <div
        v-if="Object.keys(reactions).length > 0"
        class="reaction-feed"
        aria-live="polite"
      >
        <span
          v-for="(count, emoji) in reactions"
          :key="emoji"
          class="reaction-chip"
        >
          <span aria-hidden="true">{{ emoji }}</span> × {{ count }}
        </span>
      </div>
    </div>

    <div class="waiting-footer">
      <NuxtLink class="back-button" to="/users/new">
        ユーザー登録に戻る
      </NuxtLink>
    </div>

    <HelpDialog v-if="isHelpOpen" @close="closeHelp" />
  </section>
</template>
