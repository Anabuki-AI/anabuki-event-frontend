<script setup lang="ts">
import QuizClockPanel from '~/features/quiz-control/components/QuizClockPanel.vue'
import QuizPhasePanel from '~/features/quiz-control/components/QuizPhasePanel.vue'
import QuizCurrentQuestionCard from '~/features/quiz-control/components/QuizCurrentQuestionCard.vue'
import { useQuizControl } from '~/features/quiz-control/useQuizControl'
import { useQuizClock } from '~/features/quiz-control/useQuizClock'

useSeoMeta({
  title: 'クイズ出題管理画面',
  description: 'イベント開始から問題公開・解答締め切り・答え表示までを管理する画面です。',
})

const { now } = useQuizClock(1000)
const {
  state,
  isLoading,
  isActing,
  errorMessage,
  noticeMessage,
  refresh,
  start,
  publish,
  close,
  reveal,
  end,
} = useQuizControl()
</script>

<template>
  <main class="page-shell">
    <section class="admin-card quiz-control-card">
      <NuxtLink
        class="back-link"
        to="/admin"
      >
        ← 運営者メニューへ戻る
      </NuxtLink>

      <header class="quiz-control-header">
        <div>
          <h1>クイズ出題管理画面</h1>
          <p class="muted-copy">
            イベント開始から問題公開・解答締め切り・答え表示までをこの画面から進行します。
          </p>
        </div>
      </header>

      <p
        v-if="isLoading"
        class="status-message"
        role="status"
      >
        読み込み中…
      </p>

      <p
        v-else-if="errorMessage && !state"
        class="status-message error"
        role="alert"
      >
        {{ errorMessage }}
      </p>

      <template v-else-if="state">
        <p
          v-if="errorMessage"
          class="status-message error"
          role="alert"
        >
          {{ errorMessage }}
        </p>
        <p
          v-if="noticeMessage"
          class="status-message success"
          role="status"
        >
          {{ noticeMessage }}
        </p>

        <div class="quiz-control-grid">
          <!-- 左側: 時間表示 -->
          <QuizClockPanel
            :state="state"
            :now="now"
          />

          <!-- 右側: 進行管理 -->
          <div class="quiz-control-main">
            <QuizPhasePanel
              :state="state"
              :is-acting="isActing"
              @start="start"
              @publish="publish"
              @close="close"
              @reveal="reveal"
              @end="end"
            />
            <QuizCurrentQuestionCard
              :key="state.currentQuestion?.id ?? 'none'"
              :state="state"
            />
          </div>
        </div>

        <p class="quiz-control-note">
          状態は5秒ごとに自動更新されます。最新の状態を確認したい場合は
          <button
            type="button"
            class="quiz-refresh-button"
            :disabled="isActing"
            @click="refresh"
          >
            今すぐ更新
          </button>
        </p>
      </template>
    </section>
  </main>
</template>
