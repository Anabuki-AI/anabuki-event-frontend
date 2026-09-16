<script setup lang="ts">
import QuizClockPanel from '~/features/quiz-control/components/QuizClockPanel.vue'
import QuizPhasePanel from '~/features/quiz-control/components/QuizPhasePanel.vue'
import QuizCurrentQuestionCard from '~/features/quiz-control/components/QuizCurrentQuestionCard.vue'
import { useQuizControl } from '~/features/quiz-control/useQuizControl'
import { useQuizClock } from '~/features/quiz-control/useQuizClock'
import { setupAdminSidebar } from '~/features/admin/components/AdminSidebar'

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
  phaseLabel,
  refresh,
  start,
  publish,
  close,
  reveal,
} = useQuizControl()

const {
  isSidebarExpanded,
  toggleSidebar,
  handleSidebarKeydown,
} = setupAdminSidebar()
</script>

<template>
  <main class="page-shell">
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
        <span class="admin-sidebar-link admin-sidebar-link--disabled" aria-disabled="true">問題管理（管理者専用）</span>
      </nav>
    </aside>

    <section class="admin-card quiz-control-card">
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
          :data-phase="state.phase"
        >
          {{ phaseLabel }}
        </span>
      </header>

      <p class="mock-notice">
        現在は仮のデータで動作しています。実API連携は後ほど有効になります。
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
            :history="history"
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
            />
            <QuizCurrentQuestionCard :state="state" />
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
