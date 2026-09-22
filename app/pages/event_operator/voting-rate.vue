<script setup lang="ts">
import LoadingSkeleton from '~/components/LoadingSkeleton.vue'
import { useVotingRate } from '~/features/voting-rate/use-voting-rate'
import { setupAdminSidebar } from '~/features/admin/components/AdminSidebar'
import '~/assets/css/voting-rate.css'

useSeoMeta({
  title: '投票率確認',
  description: 'クイズ大会の問題ごとの解答状況を確認するイベント運営者向けページです。',
})

const {
  isLoading,
  errorMessage,
  lastUpdatedAt,
  questionChoices,
  selectedQuestionValue,
  currentQuestion,
  participantCount,
  answeredCount,
  unansweredCount,
  answeredRatePercent,
  refresh,
} = useVotingRate()

function formatUpdatedAt(value: string | null) {
  return value ? new Date(value).toLocaleString('ja-JP') : ''
}

const {
  isSidebarExpanded,
  toggleSidebar,
  handleSidebarKeydown,
} = setupAdminSidebar()
</script>

<template>
  <main class="page-shell voting-rate-shell">
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
        <NuxtLink class="admin-sidebar-link" to="/event_operator/participants">参加者管理</NuxtLink>
      </nav>
    </aside>

    <section class="voting-card">
      <header class="voting-header">
        <div>
          <p class="eyebrow">
            Voting rate
          </p>
          <h1>投票率確認</h1>
          <p class="muted-copy">
            問題ごとの解答状況を確認できます。
          </p>
        </div>
      </header>

      <div
        v-if="errorMessage"
        class="status-message error voting-error"
        role="alert"
      >
        <span>{{ errorMessage }}</span>
        <button type="button" class="voting-retry" :disabled="isLoading" @click="refresh()">{{ isLoading ? '再試行中…' : '再試行' }}</button>
      </div>
      <p v-if="lastUpdatedAt" class="voting-updated" :class="{ 'is-stale': !!errorMessage }" role="status">
        最終更新: {{ formatUpdatedAt(lastUpdatedAt) }}<span v-if="errorMessage">（保存済みの値を表示中）</span>
      </p>
      <div
        v-if="isLoading && !currentQuestion"
        class="voting-loading"
        role="status"
        aria-busy="true"
      >
        <span class="visually-hidden">投票率を読み込み中…</span>
        <ul class="voting-summary voting-skeleton-summary">
          <li v-for="index in 3" :key="index" class="summary-item">
            <LoadingSkeleton class="voting-skeleton-summary-label" />
            <LoadingSkeleton class="voting-skeleton-summary-value" />
          </li>
        </ul>
        <div class="question-panel voting-skeleton-question">
          <LoadingSkeleton class="voting-skeleton-select" />
          <LoadingSkeleton class="voting-skeleton-question-number" />
          <LoadingSkeleton class="voting-skeleton-question-text" />
        </div>
        <div class="option-list">
          <div class="option-item voting-skeleton-option">
            <LoadingSkeleton class="voting-skeleton-option-label" />
            <LoadingSkeleton class="voting-skeleton-option-bar" />
          </div>
        </div>
      </div>

      <template v-else-if="currentQuestion">
        <ul class="voting-summary">
          <li class="summary-item">
            <span class="summary-label">参加人数</span>
            <strong class="summary-value">{{ participantCount }}<span class="summary-unit">人</span></strong>
          </li>
          <li class="summary-item">
            <span class="summary-label">解答人数</span>
            <strong class="summary-value">{{ answeredCount }} / {{ participantCount }}<span class="summary-unit">人</span></strong>
          </li>
          <li class="summary-item">
            <span class="summary-label">未解答人数</span>
            <strong class="summary-value">{{ unansweredCount }} / {{ participantCount }}<span class="summary-unit">人</span></strong>
          </li>
        </ul>

        <div class="question-panel">
          <div class="question-select-row">
            <label class="question-select">
              <span>表示する問題</span>
              <select v-model="selectedQuestionValue">
                <option v-for="question in questionChoices" :key="question.value" :value="question.value">
                  {{ question.label }}
                </option>
              </select>
            </label>
            <button type="button" class="voting-refresh" :disabled="isLoading" @click="refresh()">
              {{ isLoading ? '更新中…' : '更新' }}
            </button>
          </div>
          <p class="question-number">
            Q{{ currentQuestion.position }}
          </p>
          <p class="question-text">
            {{ answeredCount }} / {{ participantCount }}人が解答（{{ answeredRatePercent }}%）
          </p>
        </div>

        <ul class="option-list">
          <li class="option-item">
            <div class="option-head">
              <p class="option-label">
                解答率
              </p>
              <p class="option-stats">
                {{ answeredCount }}人・{{ answeredRatePercent }}%
              </p>
            </div>
            <div class="option-bar">
              <div class="option-bar-fill" :style="{ width: `${answeredRatePercent}%` }" />
            </div>
          </li>
        </ul>
      </template>

      <p v-else class="muted-copy">
        表示できる問題データがありません。
      </p>
    </section>
  </main>
</template>
