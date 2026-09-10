<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRoute } from '#imports'
import type { ReactionOption } from '~/features/waiting/types'

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

const route = useRoute()

// ユーザー登録画面からクエリで受け取る(状態管理は後の工程で整理)
const userName = ref((() => {
  const name = route.query.userName
  return typeof name === 'string' && name.length > 0 ? name : 'ゲスト'
})())

// デザイン確認用の仮データ。API連携は後の工程で置き換える。
const participantCount = ref(12)

// 参加人数が増えた瞬間だけポップアニメーションを1回鳴らす
const isCountUpdated = ref(false)
let countTimer: ReturnType<typeof setTimeout> | undefined

watch(participantCount, (next, prev) => {
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
  clearTimeout(reactionTimer)
  reactionTimer = setTimeout(() => {
    lastReactedEmoji.value = ''
  }, 500)
}
</script>

<template>
  <section class="form-card waiting-card quiz-page">
      <div class="waiting-header">
        <div class="waiting-user">
          <p class="quiz-header-title">クイズ大会</p>
          <p class="eyebrow-main">
            Waiting room
          </p>
          <div class="waiting-user-row">
            <p class="waiting-user-name">
              {{ userName }} さん
            </p>
            <NuxtLink
              class="name-edit-button"
              :to="{ path: '/users/name/edit', query: { userName } }"
              aria-label="ニックネームを編集する"
            >
              <span aria-hidden="true">✏️</span>
            </NuxtLink>
          </div>
        </div>
        <NuxtLink
          class="help-button"
          to="/users/help"
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
</template>
