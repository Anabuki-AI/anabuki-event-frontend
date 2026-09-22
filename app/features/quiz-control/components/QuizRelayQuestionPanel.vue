<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { fetchQuestions, selectRelayQuestion } from '~/features/problems/api/client'
import { toApiError } from '~/lib/api/error'
import type { Question } from '~/features/problems/types'

const props = defineProps<{
  /** ライブ進行中の問題ID。切り替わると中継問題の状態を取り直す。 */
  currentQuestionId: number | null
}>()

const emit = defineEmits<{
  /** 選択状態が変わったので出題管理の state を再取得してほしい。 */
  changed: []
}>()

const questions = ref<Question[]>([])
const relaySelectionSavingId = ref<number | null>(null)
const errorMessage = ref('')

const relayQuestions = computed(() =>
  questions.value
    .filter(question => question.isRelayQuestion)
    .sort((left, right) => left.position - right.position),
)

const hasSelection = computed(() =>
  relayQuestions.value.some(question => question.isSelectedRelayQuestion || question.isLiveQuestion),
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

function patchQuestion(question: Question) {
  const currentIndex = questions.value.findIndex(item => item.id === question.id)
  const patchedQuestions = questions.value.map((item) => {
    if (item.id === question.id) return question
    if (question.isRelayQuestion && question.isSelectedRelayQuestion && item.isRelayQuestion) {
      return { ...item, isSelectedRelayQuestion: false }
    }
    return item
  })

  if (currentIndex === -1) patchedQuestions.push(question)
  questions.value = patchedQuestions.sort((left, right) => left.position - right.position)
}

async function toggleRelaySelection(question: Question) {
  if (relaySelectionSavingId.value !== null) return

  relaySelectionSavingId.value = question.id
  errorMessage.value = ''
  try {
    const savedQuestion = await selectRelayQuestion(question, !question.isSelectedRelayQuestion)
    patchQuestion(savedQuestion)
    // 選択の影響は全中継問題に及ぶので、レスポンスを即時反映しつつ全件を裏で取り直す
    void loadRelayQuestions()
    emit('changed')
  }
  catch (error) {
    const apiError = toApiError(error)
    errorMessage.value = apiError.message
  }
  finally {
    relaySelectionSavingId.value = null
  }
}

watch(() => props.currentQuestionId, () => {
  void loadRelayQuestions()
})

onMounted(loadRelayQuestions)
</script>

<template>
  <section v-if="relayQuestions.length" class="quiz-relay-panel" aria-label="中継問題の選択">
    <p class="quiz-relay-panel-title">
      中継問題の選択
    </p>
    <p v-if="!hasSelection" class="quiz-relay-panel-note">
      今回出題する中継問題を1問選んでください。選択した問題だけ出題中に正解を確定できます。
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
        <div class="relay-selection-row">
          <button
            type="button"
            class="relay-select-toggle"
            :class="{ 'is-selected': question.isSelectedRelayQuestion }"
            :disabled="relaySelectionSavingId !== null"
            @click="toggleRelaySelection(question)"
          >
            {{ question.isSelectedRelayQuestion ? '今回の出題の選択を解除' : '今回の出題として選択' }}
          </button>
          <p v-if="question.isLiveQuestion" class="relay-selection-note is-live">
            この問題は現在ライブ出題中です。「出題管理」の正解パネルで正解を確定してください。
          </p>
        </div>
      </li>
    </ul>
  </section>
</template>
