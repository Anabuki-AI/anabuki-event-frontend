import { computed, ref, watch } from 'vue'
import { submitParticipantQuizAnswer } from '../api/client'
import type {
  AnswerChoice,
  ConfidenceLevel,
  ParticipantQuizState,
} from '../types'
import { CONFIDENCE_LEVEL_LABELS } from '../types'
import { ApiError } from '~/lib/api/error'
import { useParticipantQuizState } from './use-participant-quiz-state'

export interface ConfidenceOption {
  value: ConfidenceLevel
  label: string
  /** API契約では自信度の倍率値は参加者に返さないため、level表示を使う。 */
  multiplier: string
}

export interface UseParticipantQuizAnswerOptions {
  onWaiting: () => void
  onUnauthorized: () => void
}

export function isParticipantQuizFinishedState(state: ParticipantQuizState): boolean {
  return state.status === 'finished'
}

export function isParticipantQuizWaitingState(state: ParticipantQuizState): boolean {
  if (isParticipantQuizFinishedState(state)) return false
  return state.status === 'waiting' || state.question === null || state.phase === null
}

export type ParticipantQuizScreen = 'loading' | 'answer' | 'submitted' | 'closed' | 'revealed' | 'waiting' | 'finished'

/** API状態だけで画面を決める。FINISHED は最終問の REVEALED より常に優先する。 */
export function getParticipantQuizScreen(
  state: ParticipantQuizState | undefined,
  isLoading: boolean,
  submittedForQuestionId?: number,
): ParticipantQuizScreen {
  if (isLoading && !state) return 'loading'
  if (state && isParticipantQuizFinishedState(state)) return 'finished'
  if (!state || isParticipantQuizWaitingState(state)) return 'waiting'
  if (state.phase === 'revealed') return 'revealed'
  if (state.phase === 'closed') return 'closed'
  if (state.answered || submittedForQuestionId === state.question?.question_id) return 'submitted'
  return 'answer'
}

const CONFIDENCE_OPTIONS: ConfidenceOption[] = [3, 2, 1].map(level => ({
  value: level as ConfidenceLevel,
  label: CONFIDENCE_LEVEL_LABELS[level as ConfidenceLevel],
  multiplier: `Lv.${level}`,
}))

/** 解答送信・問題状態に応じた表示分岐を、参加者クイズAPIの状態から構成する。 */
export function useParticipantQuizAnswer(options: UseParticipantQuizAnswerOptions) {
  const selectedChoice = ref<AnswerChoice>()
  const confidenceLevel = ref<ConfidenceLevel>(2)
  const isSubmitting = ref(false)
  const isOperationBlocked = ref(false)
  const submissionMessage = ref('')
  const submittedForQuestionId = ref<number>()

  const { state, isLoading, loadError, refresh } = useParticipantQuizState({
    onState: (nextState) => {
      if (isParticipantQuizWaitingState(nextState)) options.onWaiting()
    },
    onError: (error) => {
      if (error instanceof ApiError && error.statusCode === 401) options.onUnauthorized()
    },
  })

  const question = computed(() => state.value?.question)
  const myAnswer = computed(() => state.value?.my_answer ?? null)
  const correctAnswer = computed(() => state.value?.correct_answer ?? null)

  watch(() => question.value?.question_id, (questionId, previousQuestionId) => {
    if (!questionId || questionId === previousQuestionId) return

    selectedChoice.value = undefined
    confidenceLevel.value = 2
    isOperationBlocked.value = false
    submissionMessage.value = ''
    submittedForQuestionId.value = undefined
  })

  const screen = computed(() => getParticipantQuizScreen(
    state.value,
    isLoading.value,
    submittedForQuestionId.value,
  ))

  const choices = computed(() => {
    const currentQuestion = question.value
    if (!currentQuestion) return []

    return (['A', 'B', 'C', 'D'] as const).map(key => ({
      key,
      text: currentQuestion.choices[key],
    }))
  })

  const confidenceOptions = computed(() => CONFIDENCE_OPTIONS)

  const selectedChoiceText = computed(() => {
    const selected = choices.value.find(choice => choice.key === selectedChoice.value)
    return selected ? `${selected.key}. ${selected.text}` : '未選択'
  })

  const selectedMultiplier = computed(() => confidenceOptions.value.find(option => option.value === confidenceLevel.value)?.multiplier ?? '—')
  const canSubmit = computed(() => screen.value === 'answer'
    && Boolean(selectedChoice.value)
    && !isSubmitting.value
    && !isOperationBlocked.value)

  async function submitAnswer() {
    const currentQuestion = question.value
    if (!currentQuestion || !selectedChoice.value || !canSubmit.value) return

    isSubmitting.value = true
    submissionMessage.value = ''
    try {
      await submitParticipantQuizAnswer({
        question_id: currentQuestion.question_id,
        choice: selectedChoice.value,
        confidence_level: confidenceLevel.value,
      })
      submittedForQuestionId.value = currentQuestion.question_id
      await refresh()
    }
    catch (error) {
      if (error instanceof ApiError) {
        if (error.statusCode === 401) {
          options.onUnauthorized()
          return
        }
        if (error.statusCode === 409) {
          // 受付締切後や問題が切り替わった直後の送信。最新状態を取り直して画面に反映する。
          isOperationBlocked.value = true
          submissionMessage.value = '解答受付の状態が変わりました。最新の状態を確認しています。'
          await refresh()
          return
        }
        if (error.statusCode === 403) {
          isOperationBlocked.value = true
          submissionMessage.value = 'この環境からは解答を送信できません。大会の参加ページからやり直してください。'
          return
        }
      }
      submissionMessage.value = '解答を送信できませんでした。通信状況を確認して、しばらくしてからお試しください。'
    }
    finally {
      isSubmitting.value = false
    }
  }

  return {
    state,
    question,
    myAnswer,
    correctAnswer,
    isLoading,
    loadError,
    screen,
    choices,
    confidenceOptions,
    selectedChoice,
    confidenceLevel,
    selectedChoiceText,
    selectedMultiplier,
    isSubmitting,
    canSubmit,
    submissionMessage,
    submitAnswer,
  }
}
