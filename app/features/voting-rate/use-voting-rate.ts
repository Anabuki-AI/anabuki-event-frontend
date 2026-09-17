import { computed, onMounted, ref } from 'vue'
import { request } from '~/lib/api/client'
import type { QuestionChoice, VotingRateQuestion, VotingRateResponse } from './types'
import { toApiError } from '~/lib/api/error'

const credentials = 'include' as const

/** 運営者セッションで問題ごとの解答状況を取得する。 */
export function fetchVotingRate(): Promise<VotingRateResponse> {
  return request<VotingRateResponse>('/operator/voting-rate', { credentials, retry: 0 })
}

function createQuestionChoices(questions: VotingRateQuestion[]): QuestionChoice[] {
  return questions.map(question => ({ value: String(question.questionId), label: `Q${question.position}` }))
}

function findQuestion(questions: VotingRateQuestion[], value: string): VotingRateQuestion | null {
  return questions.find(question => String(question.questionId) === value) ?? questions[0] ?? null
}

export function useVotingRate() {
  const questions = ref<VotingRateQuestion[]>([])
  const totalParticipants = ref(0)
  const isLoading = ref(false)
  const errorMessage = ref('')
  const selectedQuestionValue = ref('')

  const questionChoices = computed<QuestionChoice[]>(() => createQuestionChoices(questions.value))
  const currentQuestion = computed<VotingRateQuestion | null>(() =>
    findQuestion(questions.value, selectedQuestionValue.value),
  )

  const participantCount = computed(() => totalParticipants.value)
  const answeredCount = computed(() => currentQuestion.value?.answeredCount ?? 0)
  const unansweredCount = computed(() => Math.max(participantCount.value - answeredCount.value, 0))
  const answeredRatePercent = computed(() =>
    currentQuestion.value ? Math.round(currentQuestion.value.answeredRate * 100) : 0,
  )

  async function refresh() {
    if (isLoading.value) return

    isLoading.value = true
    errorMessage.value = ''
    try {
      const response = await fetchVotingRate()
      questions.value = [...response.questions].sort((left, right) => left.position - right.position)
      totalParticipants.value = response.total_participants
      if (!findQuestion(questions.value, selectedQuestionValue.value)) {
        selectedQuestionValue.value = questions.value[0] ? String(questions.value[0].questionId) : ''
      }
    }
    catch (error) {
      errorMessage.value = toApiError(error).message
    }
    finally {
      isLoading.value = false
    }
  }

  onMounted(() => {
    void refresh()
  })

  return {
    questions,
    isLoading,
    errorMessage,
    questionChoices,
    selectedQuestionValue,
    currentQuestion,
    participantCount,
    answeredCount,
    unansweredCount,
    answeredRatePercent,
    refresh,
  }
}
