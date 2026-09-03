<script setup lang="ts">
useSeoMeta({
  title: '解答画面',
  description: 'クイズの解答を選択して送信する、一般ユーザー向けページです。',
})

// 見た目確認用のダミーデータ（API連携なし・状態管理なし）
const question = {
  number: 'Q1',
  text: '日本の首都はどこでしょう？',
}

const choices = [
  { key: 'A', text: '東京都', selected: true },
  { key: 'B', text: '大阪府', selected: false },
  { key: 'C', text: '愛知県', selected: false },
  { key: 'D', text: '福岡県', selected: false },
]

const confidences = [
  { label: 'あり', rate: '×1.5', selected: false },
  { label: '普通', rate: '×1.0', selected: true },
  { label: 'なし', rate: '×0.5', selected: false },
]

const answerSummary = {
  choice: 'A. 東京都',
  confidence: '普通',
}

const expectedPoint = 100
</script>

<template>
  <main class="page-shell">
    <section class="answer-card">
      <NuxtLink class="back-link" to="/">
        ← ホームへ戻る
      </NuxtLink>
      <div>
        <p class="eyebrow">
          Quiz
        </p>
        <h1>解答画面</h1>
        <p class="muted-copy">
          選択肢と自信度を選んで、解答を送信してください。
        </p>
      </div>

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
          v-for="choice in choices"
          :key="choice.key"
          type="button"
          class="choice-item"
          :class="{ 'is-selected': choice.selected }"
          :aria-pressed="choice.selected"
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
            v-for="confidence in confidences"
            :key="confidence.label"
            type="button"
            class="confidence-item"
            :class="{ 'is-selected': confidence.selected }"
            :aria-pressed="confidence.selected"
          >
            <span class="confidence-name">
              {{ confidence.label }}
            </span>
            <span class="confidence-rate">
              {{ confidence.rate }}
            </span>
          </button>
        </div>
      </div>

      <div class="point-panel">
        <p class="point-summary">
          現在の選択：{{ answerSummary.choice }}／自信度：{{ answerSummary.confidence }}
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

      <button type="button" class="answer-submit">
        この内容で解答する
      </button>
    </section>

    <section class="answer-card">
      <div>
        <p class="eyebrow">
          After submit
        </p>
        <h2>解答を送信しました</h2>
        <p class="muted-copy">
          みんなの解答がそろったら、解説を公開します。
        </p>
      </div>

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

      <button type="button" class="wait-next">
        解説画面へ進む
      </button>

      <p class="answer-note">
        ※ この画面はダミーデータによる見た目確認用です（API未接続）。
      </p>
    </section>
  </main>
</template>
