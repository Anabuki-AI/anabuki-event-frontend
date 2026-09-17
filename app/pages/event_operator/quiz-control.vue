<script setup lang="ts">
import QuizCloseCountdownBar from '~/components/QuizCloseCountdownBar.vue'
import QuizClockPanel from '~/features/quiz-control/components/QuizClockPanel.vue'
import QuizPhasePanel from '~/features/quiz-control/components/QuizPhasePanel.vue'
import QuizCurrentQuestionCard from '~/features/quiz-control/components/QuizCurrentQuestionCard.vue'
import QuizTimerPanel from '~/features/quiz-control/components/QuizTimerPanel.vue'
import QuizNextQuestionPreview from '~/features/quiz-control/components/QuizNextQuestionPreview.vue'
import { useQuizControl } from '~/features/quiz-control/useQuizControl'
import { useQuizClock } from '~/features/quiz-control/useQuizClock'
import { setupAdminSidebar } from '~/features/admin/components/AdminSidebar'
import '~/assets/css/quiz-control.css'

useSeoMeta({
  title: 'クイズ出題管理画面',
  description: 'イベント開始から問題公開・解答締め切り・答え表示までを管理する画面です。',
})

const { now } = useQuizClock(1000)
const {
  state,
  history,
  isLoading,
  isActing,
  errorMessage,
  noticeMessage,
  phase,
  phaseLabel,
  refresh,
  start,
  publish,
  close,
  closeImmediately,
  reveal,
  finish,
} = useQuizControl()

const {
  isSidebarExpanded,
  toggleSidebar,
  handleSidebarKeydown,
} = setupAdminSidebar()
</script>

<template>
  <main class="page-shell admin-shell">
    <!-- 常設サイドバー。各管理画面共通のナビ。ボタンを押すとメニュー部分を完全に隠す -->
    <aside
      class="admin-sidebar"
      :class="{ 'admin-sidebar--collapsed': !isSidebarExpanded }"
      aria-label="管理機能メニュー"
      @keydown="handleSidebarKeydown"
    >
      <div class="admin-sidebar-head">
        <button
          type="button"
          class="admin-sidebar-toggle"
          :aria-label="isSidebarExpanded ? 'メニューを隠す' : 'メニューを表示する'"
          :aria-expanded="isSidebarExpanded"
          @click="toggleSidebar"
        >
          <span aria-hidden="true">☰</span>
        </button>
        <p v-if="isSidebarExpanded" class="admin-sidebar-title">メニュー</p>
      </div>
      <nav v-if="isSidebarExpanded" class="admin-sidebar-nav">
        <NuxtLink class="admin-sidebar-link" to="/event_operator">運営者メイン</NuxtLink>
        <NuxtLink class="admin-sidebar-link" to="/event_operator/voting-rate">投票率ページ</NuxtLink>
        <NuxtLink class="admin-sidebar-link" to="/event_operator/quiz-control">出題管理</NuxtLink>
        <NuxtLink class="admin-sidebar-link" to="/event_operator/management">問題管理</NuxtLink>
      </nav>
    </aside>

    <section class="admin-card quiz-control-card">
      <QuizCloseCountdownBar
        :phase="state?.phase ?? null"
        :phase-started-at="state?.phase_started_at ?? null"
        :now="now"
      />
      <header class="quiz-control-header">
        <div>
          <p class="eyebrow">
            クイズ大会
          </p>
          <h1>クイズ出題管理画面</h1>
          <p class="muted-copy">
            イベント開始から問題公開・解答締め切り・答え表示までをこの画面から進行します。
          </p>
        </div>
        <span
          v-if="state"
          class="quiz-phase-badge"
          :data-phase="phase"
        >
          {{ phaseLabel }}
        </span>
      </header>


      <p
        v-if="errorMessage"
        class="status-message error"
        role="alert"
      >
        {{ errorMessage }}
      </p>

      <p
        v-if="isLoading"
        class="status-message"
        role="status"
      >
        読み込み中…
      </p>

      <template v-else-if="state">
        <p
          v-if="noticeMessage"
          class="status-message success"
          role="status"
        >
          {{ noticeMessage }}
        </p>

        <div class="quiz-control-grid">
          <!-- 左側: 時間表示(補助情報) -->
          <div class="quiz-control-aside">
            <QuizClockPanel
              :state="state"
              :now="now"
              :history="history"
            />
            <QuizTimerPanel
              :phase="phase"
              :phase-started-at="state.phase_started_at ?? null"
              :finished-elapsed-seconds="state.finished_elapsed_seconds ?? null"
              :time-limit-seconds="state.current?.time_limit_seconds ?? null"
              :question-id="state.current?.question_id ?? null"
              :now="now"
              :is-acting="isActing"
              @expire="closeImmediately"
            />
          </div>

          <!-- 右側: 進行管理(現在の問題が主、次問プレビューは補助) -->
          <div class="quiz-control-main">
            <QuizPhasePanel
              :state="state"
              :is-acting="isActing"
              @start="start"
              @publish="publish"
              @close="close"
              @reveal="reveal"
              @finish="finish"
            />
            <QuizCurrentQuestionCard :state="state" />
            <QuizNextQuestionPreview :next-question="state.next_question ?? null" />
          </div>
        </div>

        <p class="quiz-control-note">
          状態は5秒ごとに自動更新されます。最新の状態を確認したい場合は
          <button
            type="button"
            class="quiz-refresh-button"
            :disabled="isActing"
            @click="() => refresh()"
          >
            今すぐ更新
          </button>
        </p>
      </template>
    </section>
  </main>
</template>
