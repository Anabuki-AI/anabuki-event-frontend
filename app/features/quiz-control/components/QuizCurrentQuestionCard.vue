<script setup lang="ts">
import { computed } from 'vue'
import { CHOICE_KEYS, getQuizPhase } from '../types'
import type { OperatorQuizState } from '../types'

const props = defineProps<{
  state: OperatorQuizState
}>()

const phase = computed(() => getQuizPhase(props.state))
const currentQuestion = computed(() => props.state.current)
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
const answeredRatePercent = computed(() =>
  currentQuestion.value ? Math.round(currentQuestion.value.answered_rate * 100) : 0,
)
</script>

<template>
  <article v-if="currentQuestion" class="quiz-question-card">
    <div class="quiz-question-head">
      <span class="quiz-question-id">Q{{ currentQuestion.position }}</span>
      <span class="quiz-question-status">
        {{ statusLabel }}
      </span>
      <span class="quiz-question-status">
        解答 {{ currentQuestion.answered_count }} / {{ state.total_participants }}人（{{ answeredRatePercent }}%）
      </span>
    </div>

    <p class="quiz-question-text">
      {{ currentQuestion.question_text }}
    </p>

    <ul class="quiz-question-choices">
      <li
        v-for="key in CHOICE_KEYS"
        :key="key"
        :class="{ 'is-correct': isAnswerVisible && key === currentQuestion.correct_answer }"
      >
        <span class="quiz-choice-key">{{ key }}</span>
        {{ currentQuestion.choices[key] }}
      </li>
    </ul>

    <p v-if="isAnswerVisible" class="quiz-answer-banner" role="status">
      正解は <strong>{{ currentQuestion.correct_answer }}</strong>：
      {{ currentQuestion.choices[currentQuestion.correct_answer] }}
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
      登録済み {{ state.question_count }} 問。イベント開始後、「問題公開」を押すと問題の受付が始まります。
    </p>
  </article>
</template>
