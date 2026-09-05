<script setup lang="ts">
import { useVotingRate } from '~/features/voting-rate/use-voting-rate'
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
</script>

<template>
  <main class="page-shell voting-rate-shell">
    <section class="voting-card">
      <NuxtLink class="back-link" to="/">
        ← 管理者画面へ戻る
      </NuxtLink>

      <header class="voting-header">
        <div>
          <p class="eyebrow">
            Event operator
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
