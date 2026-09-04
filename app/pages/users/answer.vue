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
