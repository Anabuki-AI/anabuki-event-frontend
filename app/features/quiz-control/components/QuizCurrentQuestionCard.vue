<script setup lang="ts">
import { computed } from 'vue'
import { CHOICE_KEYS, getCurrentQuizQuestion, getQuizPhase } from '../types'
import type { QuizState } from '../types'

const props = defineProps<{
  state: QuizState
}>()

const phase = computed(() => getQuizPhase(props.state))
const currentQuestion = computed(() => getCurrentQuizQuestion(props.state))
const isAnswerVisible = computed(() => phase.value === 'REVEALED' || phase.value === 'FINISHED')
const statusLabel = computed(() => {
  switch (phase.value) {
    case 'PUBLISHED':
      return '解答受付中'
    case 'CLOSED':
      return '解答締め切り'
    case 'REVEALED':
      return '答え表示中'
    default:
      return ''
  }
})
</script>

<template>
  <article v-if="currentQuestion" class="quiz-question-card">
    <div class="quiz-question-head">
      <span class="quiz-question-id">Q{{ currentQuestion.position }}</span>
      <span class="quiz-question-status">
        {{ statusLabel }}
      </span>
    </div>

    <p class="quiz-question-text">
      {{ currentQuestion.questionText }}
    </p>

    <ul class="quiz-question-choices">
      <li
        v-for="key in CHOICE_KEYS"
        :key="key"
        :class="{ 'is-correct': isAnswerVisible && key === currentQuestion.correctAnswer }"
      >
        <span class="quiz-choice-key">{{ key }}</span>
        {{ currentQuestion[`choice${key}`] }}
      </li>
    </ul>

    <p v-if="isAnswerVisible" class="quiz-answer-banner" role="status">
      正解は <strong>{{ currentQuestion.correctAnswer }}</strong>：
      {{ currentQuestion[`choice${currentQuestion.correctAnswer}`] }}
      （基本点 {{ currentQuestion.basePoints }} pt）
    </p>
    <p v-else class="quiz-answer-masked">
      正解は締め切り後に表示されます
    </p>
  </article>

  <article v-else class="quiz-question-card is-empty">
    <p class="quiz-question-empty-icon" aria-hidden="true">
      🕒
    </p>
    <p class="quiz-question-text">
      公開中の問題はありません。
    </p>
    <p class="quiz-answer-masked">
      登録済み {{ state.questions.length }} 問。「問題公開」を押すと次の問題の受付が始まります。
    </p>
  </article>
</template>
