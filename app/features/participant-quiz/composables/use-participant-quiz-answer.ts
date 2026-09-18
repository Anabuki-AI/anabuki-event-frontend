import { computed, ref, watch } from 'vue'
import { confirmParticipantQuizConfidence, submitParticipantQuizAnswer } from '../api/client'
import type {
  AnswerChoice,
  ConfidenceLevel,
  ConfirmParticipantQuizConfidenceInput,
  ParticipantQuizState,
} from '../types'
import { CONFIDENCE_LEVEL_LABELS } from '../types'
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

const CONFIDENCE_LEVELS: ConfidenceLevel[] = ['low', 'normal', 'high']

/** 解答送信・自信度の事前確定・問題状態に応じた表示分岐を構成する。 */
export function useParticipantQuizAnswer(options: UseParticipantQuizAnswerOptions) {
  const selectedChoice = ref<AnswerChoice>()
  const isSubmitting = ref(false)
  const isOperationBlocked = ref(false)
  const submissionMessage = ref('')
  const submittedForQuestionId = ref<number>()
  const isEditingAnswer = ref(false)
  const pendingConfidenceLevel = ref<ConfidenceLevel>()
  const isConfidenceConfirmOpen = ref(false)
  const isConfirmingConfidence = ref(false)
  const confidenceMessage = ref('')

  const { state, isLoading, loadError, applyState, beginMutation, endMutation, refresh } = useParticipantQuizState({
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
  const lockedConfidenceLevel = computed(() => state.value?.confidence_level ?? null)
  const isConfidenceLocked = computed(() => Boolean(state.value?.confidence_locked))
  const eliminatedChoice = computed(() => state.value?.question?.eliminated_choice ?? null)

  watch(() => question.value?.question_id, (questionId, previousQuestionId) => {
    if (!questionId || questionId === previousQuestionId) return

    selectedChoice.value = undefined
    isOperationBlocked.value = false
    submissionMessage.value = ''
    submittedForQuestionId.value = undefined
    isEditingAnswer.value = false
    pendingConfidenceLevel.value = undefined
    isConfidenceConfirmOpen.value = false
    isConfirmingConfidence.value = false
    confidenceMessage.value = ''
  })

  const screen = computed(() => getParticipantQuizScreen(
    state.value,
    isLoading.value,
    submittedForQuestionId.value,
  ))

  watch(() => state.value?.phase, (phase) => {
    if (phase === 'answering' || phase === 'closing') return

    isEditingAnswer.value = false
    selectedChoice.value = undefined
  })

  const choices = computed(() => {
    const currentQuestion = question.value
    if (!currentQuestion) return []

    return (['A', 'B', 'C', 'D'] as const)
      .filter(key => currentQuestion.choices[key] != null)
      .map(key => ({
        key,
        text: currentQuestion.choices[key]!,
        eliminated: key === eliminatedChoice.value,
      }))
  })

  const confidenceOptions = computed<ConfidenceOption[]>(() => CONFIDENCE_LEVELS.map(level => {
    const multiplier = state.value?.confidence_multipliers?.[level]
    return {
      value: level,
      label: CONFIDENCE_LEVEL_LABELS[level],
      multiplier: multiplier != null ? `×${multiplier.toFixed(2)}` : '—',
    }
  }))

  const selectedMultiplier = computed(() => {
    if (!lockedConfidenceLevel.value) return '—'
    return confidenceOptions.value.find(option => option.value === lockedConfidenceLevel.value)?.multiplier ?? '—'
  })

  const selectedChoiceText = computed(() => {
    const selected = choices.value.find(choice => choice.key === selectedChoice.value)
    return selected ? `${selected.key}. ${selected.text}` : '未選択'
  })

  const savedChoice = computed(() => myAnswer.value?.choice ?? null)
  const isAnswerWindowOpen = computed(() => state.value?.phase === 'answering' || state.value?.phase === 'closing')
  const hasDraftChange = computed(() => Boolean(isEditingAnswer.value && selectedChoice.value && selectedChoice.value !== savedChoice.value))

  const canSubmit = computed(() => (screen.value === 'answer' || isEditingAnswer.value)
    && Boolean(lockedConfidenceLevel.value)
    && Boolean(selectedChoice.value)
    && selectedChoice.value !== eliminatedChoice.value
    && !isSubmitting.value
    && !isOperationBlocked.value)

  function beginAnswerEditing() {
    if (!myAnswer.value || !isAnswerWindowOpen.value || isSubmitting.value) return

    selectedChoice.value = myAnswer.value.choice
    isEditingAnswer.value = true
    submissionMessage.value = ''
  }

  function cancelAnswerEditing() {
    if (isSubmitting.value) return

    isEditingAnswer.value = false
    selectedChoice.value = undefined
    submissionMessage.value = ''
  }

  function selectConfidenceLevel(level: ConfidenceLevel) {
    if (isConfidenceLocked.value || isConfirmingConfidence.value) return

    confidenceMessage.value = ''
    pendingConfidenceLevel.value = level
    // Lv.1 は一方通行なので確認ダイアログを挟む。Lv.2/3 は送信まで自由に変更できる。
    if (level === 'low') {
      isConfidenceConfirmOpen.value = true
      return
    }

    void confirmConfidenceLevel(level)
  }

  function cancelConfidenceSelection() {
    if (isConfirmingConfidence.value) return

    pendingConfidenceLevel.value = undefined
    isConfidenceConfirmOpen.value = false
  }

  async function confirmPendingConfidenceSelection() {
    const level = pendingConfidenceLevel.value
    if (!level) return

    await confirmConfidenceLevel(level)
  }

  async function confirmConfidenceLevel(level: ConfidenceLevel) {
    const currentQuestion = question.value
    if (!currentQuestion || isConfidenceLocked.value || isConfirmingConfidence.value) return

    isConfirmingConfidence.value = true
    pendingConfidenceLevel.value = level
    confidenceMessage.value = ''
    beginMutation()
    try {
      const input: ConfirmParticipantQuizConfidenceInput = {
        question_id: currentQuestion.question_id,
        confidence_level: level,
      }
      if (selectedChoice.value) input.choice = selectedChoice.value
      applyState(await confirmParticipantQuizConfidence(input))
      pendingConfidenceLevel.value = undefined
      isConfidenceConfirmOpen.value = false
    }
    catch (error) {
      pendingConfidenceLevel.value = undefined
      isConfidenceConfirmOpen.value = false
      if (error instanceof ApiError) {
        if (error.statusCode === 401) {
          options.onUnauthorized()
          return
        }
        if (error.statusCode === 409) {
          confidenceMessage.value = '自信度を確定できませんでした。問題の状態を確認しています。'
          await refresh()
          return
        }
      }
      confidenceMessage.value = '自信度を確定できませんでした。通信状況を確認して、もう一度お試しください。'
    }
    finally {
      endMutation()
      isConfirmingConfidence.value = false
    }
  }

  async function submitAnswer() {
    const currentQuestion = question.value
    if (!currentQuestion || !selectedChoice.value || !canSubmit.value) return

    isSubmitting.value = true
    submissionMessage.value = ''
    beginMutation()
    try {
      const result = await submitParticipantQuizAnswer({
        question_id: currentQuestion.question_id,
        choice: selectedChoice.value,
      })
      submittedForQuestionId.value = currentQuestion.question_id
      isEditingAnswer.value = false
      selectedChoice.value = undefined
      if (state.value?.question?.question_id === currentQuestion.question_id) {
        // The answer API response only contains my_answer. Mirror the server's
        // state transition locally so the confidence controls do not appear
        // editable until the next poll arrives.
        applyState({
          ...state.value,
          answered: true,
          my_answer: result.my_answer,
          confidence_level: result.my_answer.confidence_level,
          confidence_locked: true,
        })
      }
    }
    catch (error) {
      if (error instanceof ApiError) {
        if (error.statusCode === 401) {
          options.onUnauthorized()
          return
        }
        if (error.statusCode === 409) {
          isOperationBlocked.value = true
          isEditingAnswer.value = false
          selectedChoice.value = undefined
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
      endMutation()
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
    lockedConfidenceLevel,
    isConfidenceLocked,
    eliminatedChoice,
    selectedChoice,
    selectedChoiceText,
    selectedMultiplier,
    savedChoice,
    hasDraftChange,
    isEditingAnswer,
    isAnswerWindowOpen,
    beginAnswerEditing,
    cancelAnswerEditing,
    isConfidenceConfirmOpen,
    isConfirmingConfidence,
    pendingConfidenceLevel,
    confidenceMessage,
    isSubmitting,
    canSubmit,
    submissionMessage,
    selectConfidenceLevel,
    cancelConfidenceSelection,
    confirmPendingConfidenceSelection,
    submitAnswer,
  }
}
