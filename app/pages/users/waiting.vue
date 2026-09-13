<script setup lang="ts">
import { ref, useSeoMeta } from '#imports'
import { reactionOptions } from '~/features/waiting/components/ReactionButton'
import {
  setupUserName,
  setupWaitingRoom,
} from '~/features/waiting/components/WaitingRoom'

useSeoMeta({
  title: '待機画面',
  description: 'Anabuki Eventのイベント待機画面です。',
})

const userName = setupUserName()

// デザイン確認用の仮データ。API連携は後の工程で置き換える。
const participantCount = ref(12)

// 各TSモジュールのロジックを接続(旧3コンポーネントのscript)
const {
  isCountUpdated,
  lastReactedEmoji,
  handleReact,
} = setupWaitingRoom(participantCount)

</script>

<template>
  <main class="page-shell">
    <section class="form-card waiting-card">
      <div class="waiting-header">
        <div class="waiting-user">
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
          to="/help#waiting-room"
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
