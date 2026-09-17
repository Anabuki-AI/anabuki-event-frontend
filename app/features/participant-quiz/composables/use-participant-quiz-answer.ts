import { computed, ref, watch } from 'vue'
import { submitParticipantQuizAnswer } from '../api/client'
import type { AnswerChoice, ConfidenceLevel, ParticipantQuizState } from '../types'
import { ApiError } from '~/lib/api/error'
import { useParticipantQuizState } from './use-participant-quiz-state'

export interface ConfidenceOption {
  value: ConfidenceLevel
  label: string
  multiplier: string
}

export interface UseParticipantQuizAnswerOptions {
  onWaiting: () => void
  onUnauthorized: () => void
}

export function isParticipantQuizFinishedState(state: ParticipantQuizState): boolean {
  return state.event?.status === 'FINISHED'
}

export function isParticipantQuizWaitingState(state: ParticipantQuizState): boolean {
  return !isParticipantQuizFinishedState(state) && (!state.event || !state.question || state.question.status === 'PENDING')
}

export type ParticipantQuizScreen = 'loading' | 'answer' | 'submitted' | 'closed' | 'revealed' | 'waiting' | 'finished'

/** API状態だけで画面を決める。FINISHED は最終問の REVEALED より常に優先する。 */
export function getParticipantQuizScreen(
  state: ParticipantQuizState | undefined,
  isLoading: boolean,
  submittedForQuestionId?: number,
): ParticipantQuizScreen {
  const currentQuestion = state?.question
  if (isLoading && !state) return 'loading'
  if (state && isParticipantQuizFinishedState(state)) return 'finished'
  if (!state || isParticipantQuizWaitingState(state)) return 'waiting'
  if (currentQuestion?.status === 'REVEALED') return 'revealed'
  if (currentQuestion?.status === 'CLOSED') return 'closed'
  if (currentQuestion?.status === 'PUBLISHED' && (currentQuestion.myAnswer || submittedForQuestionId === currentQuestion.id)) return 'submitted'
  return 'answer'
}

/** 解答送信・問題状態に応じた表示分岐を、参加者クイズAPIの状態から構成する。 */
export function useParticipantQuizAnswer(options: UseParticipantQuizAnswerOptions) {
  const selectedChoice = ref<AnswerChoice>()
  const confidenceLevel = ref<ConfidenceLevel>('normal')
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
  const event = computed(() => state.value?.event)

  watch(() => question.value?.id, (questionId, previousQuestionId) => {
    if (!questionId || questionId === previousQuestionId) return

    selectedChoice.value = undefined
    confidenceLevel.value = 'normal'
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

    return [
      { key: 'A' as const, text: currentQuestion.choiceA },
      { key: 'B' as const, text: currentQuestion.choiceB },
      { key: 'C' as const, text: currentQuestion.choiceC },
      { key: 'D' as const, text: currentQuestion.choiceD },
    ]
  })

  const confidenceOptions = computed<ConfidenceOption[]>(() => {
    const multipliers = event.value?.confidenceMultipliers
    return [
      { value: 'high', label: '高い', multiplier: multipliers?.high ?? '—' },
      { value: 'normal', label: '普通', multiplier: multipliers?.normal ?? '—' },
      { value: 'low', label: '低い', multiplier: multipliers?.low ?? '—' },
    ]
  })

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
        quizEventQuestionId: currentQuestion.id,
        answer: selectedChoice.value,
        confidenceLevel: confidenceLevel.value,
      })
      submittedForQuestionId.value = currentQuestion.id
      await refresh()
    }
    catch (error) {
      if (error instanceof ApiError) {
        if (error.statusCode === 401) {
          options.onUnauthorized()
          return
        }
        if (error.statusCode === 409) {
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
    event,
    question,
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
