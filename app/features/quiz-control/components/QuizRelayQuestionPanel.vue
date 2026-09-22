<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { fetchQuestions } from '~/features/problems/api/client'
import { toApiError } from '~/lib/api/error'
import type { Question } from '~/features/problems/types'

const props = defineProps<{
  /** ライブ進行中の問題ID。切り替わると中継問題の状態を取り直す。 */
  currentQuestionId: number | null
}>()

const questions = ref<Question[]>([])
const errorMessage = ref('')

const relayQuestions = computed(() =>
  questions.value
    .filter(question => question.isRelayQuestion)
    .sort((left, right) => left.position - right.position),
)

async function loadRelayQuestions() {
  try {
    questions.value = await fetchQuestions()
    errorMessage.value = ''
  }
  catch (error) {
    const apiError = toApiError(error)
    errorMessage.value = apiError.message
  }
}

// management.vue の relayBadgeText と同じ4状態。文言は画面間で揃える。
function relayBadgeText(question: Question): string {
  if (question.isLiveQuestion) return '中継問題・ライブ出題中'
  if (question.isSelectedRelayQuestion) return '中継問題・選択中'
  if (question.revealedAt) return '中継問題・出題済み'
  return '中継問題'
}

watch(() => props.currentQuestionId, () => {
  void loadRelayQuestions()
})

onMounted(loadRelayQuestions)
</script>

<template>
  <section v-if="relayQuestions.length" class="quiz-relay-panel" aria-label="中継問題の状態">
    <p class="quiz-relay-panel-title">
      中継問題
    </p>
    <p class="quiz-relay-panel-info">
      中継問題は出題されると自動で選択状態になり、出題中に正解を確定できます。
    </p>
    <p v-if="errorMessage" class="status-message error" role="alert">
      {{ errorMessage }}
    </p>

    <ul class="quiz-relay-list">
      <li v-for="question in relayQuestions" :key="question.id" class="quiz-relay-item">
        <div class="quiz-relay-row">
          <span class="quiz-next-preview-id">Q{{ question.position }}</span>
          <span class="quiz-relay-text">{{ question.questionText }}</span>
          <span
            class="relay-badge"
            :class="{
              'is-live': question.isLiveQuestion,
              'is-selected': !question.isLiveQuestion && question.isSelectedRelayQuestion,
              'is-revealed': !question.isLiveQuestion && !question.isSelectedRelayQuestion && !!question.revealedAt,
            }"
          >{{ relayBadgeText(question) }}</span>
        </div>
      </li>
    </ul>
  </section>
</template>
