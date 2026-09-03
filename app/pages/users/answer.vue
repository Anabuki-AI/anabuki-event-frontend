<script setup lang="ts">
import { useAnswer } from '~/features/answer/use-answer'

useSeoMeta({
  title: '解答画面',
  description: 'クイズの解答を選択して送信する、一般ユーザー向けページです。',
})

// 状態・ロジックは features/answer/use-answer.ts に集約
const {
  question,
  choices,
  confidenceOptions,
  selectedChoice,
  confidence,
  submitted,
  selectedChoiceText,
  expectedPoint,
  selectChoice,
  selectConfidence,
  submitAnswer,
} = useAnswer()
</script>

<template>
  <div class="page-shell answer-shell">
    <header class="answer-header">
      <p class="eyebrow">
        Quiz
      </p>
      <h1>解答画面</h1>
    </header>

    <main class="answer-main">
      <section v-if="!submitted" class="answer-card">
        <div class="question-panel">
          <p class="question-number">
            {{ question.number }}
          </p>
          <p class="question-text">
            {{ question.text }}
          </p>
        </div>

        <div class="choice-list">
          <button
            v-for="(choice, index) in choices"
            :key="choice.key"
            type="button"
            class="choice-item"
            :class="{ 'is-selected': selectedChoice === index }"
            :aria-pressed="selectedChoice === index"
            @click="selectChoice(index)"
          >
            <span class="choice-key">
              {{ choice.key }}
            </span>
            <span class="choice-text">
              {{ choice.text }}
            </span>
            <span class="choice-check" aria-hidden="true">✓</span>
          </button>
        </div>

        <div class="confidence-field">
          <p class="confidence-label">
            自信度
          </p>
          <div class="confidence-list">
            <button
              v-for="option in confidenceOptions"
              :key="option.label"
              type="button"
              class="confidence-item"
              :class="{ 'is-selected': confidence === option.label }"
              :aria-pressed="confidence === option.label"
              @click="selectConfidence(option.label)"
            >
              <span class="confidence-name">
                {{ option.label }}
              </span>
              <span class="confidence-rate">
                {{ option.rate }}
              </span>
            </button>
          </div>
        </div>

        <div class="point-panel">
          <p class="point-summary">
            現在の選択：{{ selectedChoiceText }}／自信度：{{ confidence }}
          </p>
          <p class="point-value">
            {{ expectedPoint }}<span class="point-unit">pt</span>
          </p>
          <p class="point-caption">
            この内容で送信すると獲得できる予定のポイント
          </p>
        </div>

        <p class="answer-note">
          ※ 送信する前なら、選択肢と自信度は何度でも変更できます。
        </p>

        <button
          type="button"
          class="answer-submit"
          :disabled="selectedChoice === null"
          @click="submitAnswer"
        >
          この内容で解答する
        </button>
      </section>

      <section v-else class="answer-card">
        <p class="eyebrow">
          After submit
        </p>
        <h2>解答を送信しました</h2>
        <p class="muted-copy">
          みんなの解答がそろったら、解説を公開します。
        </p>

        <div class="wait-state">
          <div class="wait-dots" aria-hidden="true">
            <span class="wait-dot" />
            <span class="wait-dot" />
            <span class="wait-dot" />
          </div>
          <p class="wait-text">
            解説の公開を待っています…
          </p>
        </div>

        <!-- 解説ページが未作成のため、見た目のみのボタン -->
        <button type="button" class="wait-next">
          解説画面へ進む
        </button>

        <p class="answer-note">
          ※ この画面はダミーデータによる見た目確認用です（API未接続）。
        </p>
      </section>
    </main>
  </div>
</template>

<style scoped>
/* ページ全体: 背景 #fff（問題・解答コンテンツ側は #edeffa）・縦方向は中央に詰める */
.answer-shell {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  min-height: 100vh;
  padding: 0;
  background: #fff;
}

/* ヘッダー */
.answer-header {
  display: grid;
  gap: 2px;
  padding: 12px 20px 10px;
  border-bottom: 1px solid #d6ddea;
  background: #fff;
}

.answer-header .eyebrow {
  margin: 0;
}

.answer-header h1 {
  margin: 0;
  font-size: 1.375rem;
  line-height: 1.2;
  letter-spacing: -0.01em;
}

.answer-main {
  flex: 1;
  display: grid;
  place-items: center;
  padding: 14px 16px 18px;
}

/* 問題・解答コンテンツ（このページ専用: 背景 #edeffa） */
.answer-card {
  display: grid;
  gap: 12px;
  width: min(100%, 520px);
  padding: 18px 16px;
  border: 1px solid rgb(19 34 56 / 10%);
  border-radius: 20px;
  background: #edeffa;
}

.answer-card h2 {
  margin: 0;
  font-size: 1.375rem;
  line-height: 1.25;
}

.answer-card .muted-copy {
  margin: 0;
}

.answer-card .eyebrow {
  margin: 0;
}

.question-panel {
  display: grid;
  gap: 2px;
}

.question-number {
  margin: 0;
  color: #1769c2;
  font-size: 0.9375rem;
  font-weight: 800;
  letter-spacing: 0.08em;
}

.question-text {
  margin: 0;
  color: #132238;
  font-size: 1.0625rem;
  font-weight: 700;
  line-height: 1.5;
}

/* 選択肢（白地 + border、選択中はメインカラーで強調） */
.choice-list {
  display: grid;
  gap: 8px;
}

.choice-item {
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 50px;
  padding: 8px 14px;
  border: 1px solid #c7d3e0;
  border-radius: 12px;
  color: #132238;
  background: #fff;
  font-weight: 600;
  text-align: left;
  transition: border 150ms ease, background 150ms ease;
}

.choice-item:hover {
  border-color: #1769c2;
}

.choice-item:focus {
  border-color: #1769c2;
  box-shadow: 0 0 0 4px rgb(23 105 194 / 12%);
  outline: none;
}

.choice-key {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 30px;
  height: 30px;
  border-radius: 999px;
  color: #1769c2;
  background: #edeffa;
  font-size: 0.875rem;
  font-weight: 800;
}

.choice-text {
  font-size: 1rem;
}

.choice-check {
  margin: 0 0 0 auto;
  color: #1769c2;
  font-weight: 800;
  opacity: 0;
}

.choice-item.is-selected {
  border-color: #1769c2;
  background: rgb(23 105 194 / 10%);
  box-shadow: inset 0 0 0 1px #1769c2;
}

.choice-item.is-selected .choice-key {
  color: #fff;
  background: #1769c2;
}

.choice-item.is-selected .choice-check {
  opacity: 1;
}

/* 自信度（1つだけ選択可能） */
.confidence-field {
  display: grid;
  gap: 6px;
}

.confidence-label {
  margin: 0;
  color: #253750;
  font-size: 0.875rem;
  font-weight: 700;
}

.confidence-list {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
}

.confidence-item {
  display: grid;
  align-content: center;
  justify-items: center;
  gap: 2px;
  min-height: 50px;
  padding: 6px 8px;
  border: 1px solid #c7d3e0;
  border-radius: 12px;
  color: #132238;
  background: #fff;
  transition: border 150ms ease, background 150ms ease, color 150ms ease;
}

.confidence-item:hover {
  border-color: #1769c2;
}

.confidence-item:focus {
  border-color: #1769c2;
  box-shadow: 0 0 0 4px rgb(23 105 194 / 12%);
  outline: none;
}

.confidence-name {
  font-size: 1rem;
  font-weight: 700;
}

.confidence-rate {
  color: #516176;
  font-size: 0.8125rem;
  font-weight: 600;
}

.confidence-item.is-selected {
  border-color: #1769c2;
  color: #fff;
  background: #1769c2;
}

.confidence-item.is-selected .confidence-rate {
  color: rgb(255 255 255 / 78%);
}

/* 現在の選択 + 予定獲得ポイント */
.point-panel {
  display: grid;
  gap: 2px;
  padding: 12px 14px;
  border: 1px solid rgb(23 105 194 / 25%);
  border-radius: 12px;
  background: #fff;
}

.point-summary {
  margin: 0;
  color: #132238;
  font-size: 0.9375rem;
  font-weight: 700;
}

.point-value {
  margin: 0;
  color: #1769c2;
  font-size: 1.5rem;
  letter-spacing: -0.02em;
}

.point-unit {
  margin-left: 4px;
  font-size: 0.8125rem;
  font-weight: 600;
}

.point-caption {
  margin: 0;
  color: #516176;
  font-size: 0.8125rem;
}

.answer-note {
  margin: 0;
  color: #516176;
  font-size: 0.8125rem;
}

.answer-submit {
  min-height: 52px;
  border: 0;
  border-radius: 12px;
  color: #fff;
  background: #1769c2;
  font-weight: 750;
  transition: background 150ms ease, transform 150ms ease;
}

.answer-submit:hover:not(:disabled) {
  background: #0f57a4;
  transform: translateY(-1px);
}

.answer-submit:focus {
  box-shadow: 0 0 0 4px rgb(23 105 194 / 12%);
  outline: none;
}

.answer-submit:disabled {
  cursor: not-allowed;
  opacity: 0.45;
}

/* 送信後の待機画面 */
.wait-state {
  display: grid;
  justify-items: center;
  gap: 12px;
  padding: 20px 16px;
  border-radius: 12px;
  background: #fff;
  text-align: center;
}

.wait-dots {
  display: flex;
  gap: 8px;
}

.wait-dot {
  width: 10px;
  height: 10px;
  border-radius: 999px;
  background: #1769c2;
  animation: wait-dot-pulse 1.4s ease-in-out infinite;
}

.wait-dot:nth-child(2) {
  animation-delay: 0.2s;
}

.wait-dot:nth-child(3) {
  animation-delay: 0.4s;
}

.wait-text {
  margin: 0;
  color: #516176;
  font-size: 1rem;
  font-weight: 600;
}

.wait-next {
  min-height: 48px;
  padding: 0 22px;
  border: 2px solid #1769c2;
  border-radius: 12px;
  color: #1769c2;
  background: #fff;
  font-weight: 750;
  transition: background 150ms ease;
}

.wait-next:hover {
  background: rgb(23 105 194 / 8%);
}

.wait-next:focus {
  box-shadow: 0 0 0 4px rgb(23 105 194 / 12%);
  outline: none;
}

@keyframes wait-dot-pulse {
  0%,
  100% {
    opacity: 0.25;
    transform: scale(0.85);
  }

  50% {
    opacity: 1;
    transform: scale(1);
  }
}

@media (prefers-reduced-motion: reduce) {
  .wait-dot {
    animation: none;
  }
}
</style>
