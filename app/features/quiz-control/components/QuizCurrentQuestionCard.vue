<script setup lang="ts">
import { CHOICE_KEYS, formatMultiplier } from '../types'
import type { QuizState } from '../types'

const props = defineProps<{
  state: QuizState
}>()

const isAnswerVisible = computed(() => props.state.phase === 'REVEALED' || props.state.phase === 'ENDED')
</script>

<template>
  <article
    v-if="state.currentQuestion"
    class="quiz-question-card"
  >
    <div class="quiz-question-head">
      <span class="quiz-question-id">Q{{ state.currentQuestion.id }}</span>
      <span class="quiz-question-status">
        {{ state.phase === 'PUBLISHING' ? '解答受付中' : state.phase === 'CLOSED' ? '解答締め切り' : '答え表示中' }}
      </span>
    </div>

    <p class="quiz-question-text">
      {{ state.currentQuestion.questionText }}
    </p>

    <ul class="quiz-question-choices">
      <li
        v-for="key in CHOICE_KEYS"
        :key="key"
        :class="{ 'is-correct': isAnswerVisible && key === state.currentQuestion?.correctAnswer }"
      >
        <span class="quiz-choice-key">{{ key }}</span>
        {{ state.currentQuestion.choices[key] }}
      </li>
    </ul>

    <p
      v-if="isAnswerVisible"
      class="quiz-answer-banner"
      role="status"
    >
      正解は <strong>{{ state.currentQuestion.correctAnswer }}</strong>：
      {{ state.currentQuestion.choices[state.currentQuestion.correctAnswer] }}
      （自信度倍率 ×{{ formatMultiplier(state.currentQuestion.confidenceMultiplier) }}）
    </p>
    <p
      v-else
      class="quiz-answer-masked"
    >
      正解は締め切り後に表示されます
    </p>
  </article>

  <article
    v-else
    class="quiz-question-card is-empty"
  >
    <p class="quiz-question-text">
      公開中の問題はありません。
    </p>
    <p class="quiz-answer-masked">
      登録済み {{ state.totalQuestions }} 問。「問題公開」を押すと次の問題の受付が始まります。
    </p>
  </article>
</template>
