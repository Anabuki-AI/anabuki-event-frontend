<script setup lang="ts">
useSeoMeta({
  title: '投票率確認',
  description: 'クイズ大会の問題ごとの解答状況と選択肢ごとの投票率を確認する管理者向けページです。',
})

// 見た目確認用のダミーデータ（API連携なし）
const participantCount = 48
const answeredCount = 45
const unansweredCount = 3

const questionChoices = [
  { value: 'q1', label: 'Q1' },
  { value: 'q2', label: 'Q2' },
  { value: 'q3', label: 'Q3' },
]

const currentQuestion = {
  number: 'Q1',
  text: '日本の首都はどこでしょう？',
}

const options = [
  { key: 'A', label: '選択肢A', text: '東京都', votes: 28, rate: 62 },
  { key: 'B', label: '選択肢B', text: '大阪府', votes: 9, rate: 20 },
  { key: 'C', label: '選択肢C', text: '愛知県', votes: 5, rate: 11 },
  { key: 'D', label: '選択肢D', text: '福岡県', votes: 3, rate: 7 },
]
</script>

<template>
  <main class="page-shell">
    <section class="voting-card">
      <header class="voting-header">
        <div>
          <p class="eyebrow">
            Admin
          </p>
          <h1>投票率確認</h1>
          <p class="muted-copy">
            問題ごとの解答状況と、選択肢ごとの投票率を確認できます。
          </p>
        </div>
        <div class="voting-actions">
          <button type="button" class="voting-refresh">
            更新
          </button>
          <NuxtLink class="back-link" to="/">
            ← 管理者画面へ戻る
          </NuxtLink>
        </div>
      </header>

      <ul class="voting-summary">
        <li class="summary-item">
          <span class="summary-label">現在の参加人数</span>
          <strong class="summary-value">{{ participantCount }}<span class="summary-unit">人</span></strong>
        </li>
        <li class="summary-item">
          <span class="summary-label">解答人数</span>
          <strong class="summary-value">{{ answeredCount }}<span class="summary-unit">人</span></strong>
        </li>
        <li class="summary-item">
          <span class="summary-label">未解答人数</span>
          <strong class="summary-value">{{ unansweredCount }}<span class="summary-unit">人</span></strong>
        </li>
      </ul>

      <div class="question-panel">
        <label class="question-select">
          <span>表示する問題</span>
          <select>
            <option v-for="question in questionChoices" :key="question.value" :value="question.value">
              {{ question.label }}
            </option>
          </select>
        </label>
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
