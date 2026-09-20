<script setup lang="ts">
import { computed } from 'vue'
import { CHOICE_KEYS, getQuizPhase } from '../types'
import type { ChoiceKey, OperatorQuizState } from '../types'
import { resolveApiImageUrl } from '~/lib/api/image'

const props = defineProps<{
  state: OperatorQuizState
  isActing?: boolean
}>()
const emit = defineEmits<{
  correctAnswer: [choice: ChoiceKey]
}>()

const phase = computed(() => getQuizPhase(props.state))
const currentQuestion = computed(() => props.state.current)
const imageUrl = computed(() => resolveApiImageUrl(currentQuestion.value?.image_url ?? null))
const isAnswerVisible = computed(() => phase.value === 'REVEALED' || phase.value === 'FINISHED')
const isLiveRelayQuestion = computed(() =>
  currentQuestion.value?.is_relay_question === true
  && currentQuestion.value?.is_selected_relay_question === true,
)
const isCorrectAnswerEditable = computed(() =>
  props.state.status === 'in_progress'
  && isLiveRelayQuestion.value
  && phase.value !== 'REVEALED'
  && phase.value !== 'FINISHED',
)
/** 正解未確定のまま答え表示すると仮の値が公開されてしまうため、確定済みかどうかで注記を出し分ける。 */
const isLiveCorrectAnswerConfirmed = computed(() =>
  !isLiveRelayQuestion.value || currentQuestion.value?.live_correct_answer_confirmed === true,
)
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

function selectCorrectAnswer(choice: ChoiceKey) {
  if (!isCorrectAnswerEditable.value || props.isActing) return
  if (currentQuestion.value?.correct_answer === choice) return
  emit('correctAnswer', choice)
}
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

    <img
      v-if="imageUrl"
      class="quiz-question-image"
      :src="imageUrl"
      alt=""
    >

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
    <p v-if="isAnswerVisible && currentQuestion.explanation" class="quiz-answer-explanation">
      <span class="quiz-answer-explanation-label">解説</span>
      {{ currentQuestion.explanation }}
    </p>
    <p v-if="!isAnswerVisible" class="quiz-answer-masked">
      正解は締め切り後に表示されます
    </p>

    <fieldset
      v-if="isLiveRelayQuestion"
      class="quiz-live-answer-selector"
      :disabled="!isCorrectAnswerEditable || props.isActing"
    >
      <legend>中継問題の正解</legend>
      <p
        class="quiz-live-answer-selector-note"
        :class="{ 'is-warning': !isLiveCorrectAnswerConfirmed }"
      >
        <template v-if="isLiveCorrectAnswerConfirmed">
          参加者への答え表示前に、運営側で正解を確定してください。選択は即時反映されます。
        </template>
        <template v-else>
          正解が未確定です。下から必ず選択してから答え表示してください（未選択のまま表示すると仮の値が公開されます）。
        </template>
      </p>
      <div class="quiz-live-answer-options" role="radiogroup" aria-label="中継問題の正解">
        <label v-for="key in CHOICE_KEYS" :key="key" class="quiz-live-answer-option">
          <input
            type="radio"
            name="live-relay-correct-answer"
            :value="key"
            :checked="currentQuestion.correct_answer === key && isLiveCorrectAnswerConfirmed"
            @change="selectCorrectAnswer(key)"
          >
          <span>{{ key }}：{{ currentQuestion.choices[key] }}</span>
        </label>
      </div>
      <p v-if="!isCorrectAnswerEditable" class="quiz-live-answer-selector-note">
        答え表示後は正解を変更できません。
      </p>
    </fieldset>
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
