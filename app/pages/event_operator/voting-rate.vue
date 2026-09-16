<script setup lang="ts">
import { useVotingRate } from '~/features/voting-rate/use-voting-rate'
import { setupAdminSidebar } from '~/features/admin/components/AdminSidebar'
import '~/assets/css/voting-rate.css'

useSeoMeta({
  title: '投票率確認',
  description: 'クイズ大会の問題ごとの解答状況と選択肢ごとの投票率を確認するイベント運営者向けページです。',
})

const {
  questionChoices,
  selectedQuestionValue,
  currentQuestion,
  participantCount,
  answeredCount,
  unansweredCount,
  options,
  refresh,
} = useVotingRate()

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
        <NuxtLink class="admin-sidebar-link" to="/admin/problems">問題管理</NuxtLink>
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
            問題ごとの解答状況と、選択肢ごとの投票率を確認できます。
          </p>
        </div>
      </header>

      <ul class="voting-summary">
        <li class="summary-item">
          <span class="summary-label">現在の参加人数</span>
          <strong class="summary-value">{{ participantCount }} / {{ participantCount }}<span class="summary-unit">人</span></strong>
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
          <button type="button" class="voting-refresh" @click="refresh()">
            更新
          </button>
        </div>
        <p class="question-number">
          {{ currentQuestion.number }}
        </p>
        <p class="question-text">
          {{ currentQuestion.text }}
        </p>
      </div>

      <ul class="option-list">
        <li v-for="option in options" :key="option.key" class="option-item">
          <div class="option-head">
            <p class="option-label">
              {{ option.label }}
            </p>
            <p class="option-text">
              {{ option.text }}
            </p>
            <p class="option-stats">
              {{ option.votes }}人・{{ option.rate }}%
            </p>
          </div>
          <div class="option-bar">
            <div class="option-bar-fill" :style="{ width: `${option.rate}%` }" />
          </div>
        </li>
      </ul>

      <p class="voting-note">
        ※ この画面はダミーデータによる見た目確認用です（API未接続）。
      </p>
    </section>
  </main>
</template>
