import { computed, onMounted, onUnmounted, ref } from 'vue'
import type { OperatorQuizResetOperation, OperatorQuizState } from './types'
import { getNextQuizPosition, getQuizPhase, PHASE_LABELS } from './types'
import {
  closeAnswers,
  closeAnswersImmediately,
  fetchQuizState,
  finishQuiz,
  publishQuestion,
  revealAnswer,
  resetQuiz,
  startQuiz,
} from './api/client'
import { ApiError, toApiError } from '~/lib/api/error'

export interface QuizHistoryEntry {
  time: string
  label: string
}

const INVALID_TRANSITION_MESSAGE = '現在の状態では実行できない操作です。最新の状態を確認してください。'

/** 運営APIの状態を同期し、実際の進行操作を一度ずつ実行する。 */
export function useQuizControl() {
  const state = ref<OperatorQuizState | null>(null)
  const isLoading = ref(true)
  const isActing = ref(false)
  const errorMessage = ref('')
  const noticeMessage = ref('')
  const history = ref<QuizHistoryEntry[]>([])
  const resetOperation = ref<OperatorQuizResetOperation | null>(null)
  let refreshPromise: Promise<boolean> | undefined

  async function refresh(preserveError = false, force = false, preserveResetOperation = false) {
    if (refreshPromise) {
      const completed = await refreshPromise
      if (!force) return completed
    }

    const load = (async () => {
      try {
        state.value = await fetchQuizState()
        if (!preserveError) errorMessage.value = ''
        return true
      }
      catch (error) {
        if (!preserveResetOperation) resetOperation.value = null
        errorMessage.value = toApiError(error).message
        return false
      }
      finally {
        isLoading.value = false
      }
    })()
    refreshPromise = load

    try {
      return await load
    }
    finally {
      if (refreshPromise === load) refreshPromise = undefined
    }
  }

  async function act(
    action: () => Promise<OperatorQuizState>,
    successNotice: string,
    historyLabel: string,
    useInvalidTransitionMessage = true,
  ): Promise<boolean> {
    if (isActing.value) return false

    errorMessage.value = ''
    noticeMessage.value = ''
    isActing.value = true
    try {
      await action()
      // 操作レスポンスを表示用の唯一の状態にせず、必ず最新stateを取り直す。
      if (!await refresh(false, true)) return false

      history.value.push({ time: new Date().toISOString(), label: historyLabel })
      noticeMessage.value = successNotice
      return true
    }
    catch (error) {
      // 通常の422は不正な遷移として案内するが、resetの確認エラーは
      // バックエンドのメッセージをそのまま表示して契約を隠さない。
      resetOperation.value = null
      errorMessage.value = error instanceof ApiError && error.statusCode === 422 && useInvalidTransitionMessage
        ? INVALID_TRANSITION_MESSAGE
        : toApiError(error).message
      await refresh(true, true)
      return false
    }
    finally {
      isActing.value = false
    }
  }

  const start = () => act(startQuiz, 'イベントを開始しました。', 'イベント開始')

  const publish = () => act(
    publishQuestion,
    '次の問題を公開しました。参加者は解答できます。',
    '問題公開',
  )

  const close = () => act(closeAnswers, '10秒後に解答受付を締め切ります。', '解答締め切りを開始')
  const closeImmediately = () => act(closeAnswersImmediately, '解答の受付を締め切りました。', '時間切れで解答締め切り')
  const reveal = () => act(revealAnswer, '答えを表示しました。', '答え表示')
  const finish = () => act(finishQuiz, 'クイズ大会を終了しました。', 'クイズ終了')
  const reset = async (confirmation: string) => {
    if (isActing.value) return false

    resetOperation.value = null
    errorMessage.value = ''
    noticeMessage.value = ''
    isActing.value = true
    try {
      // A 200 receipt proves the destructive operation committed.  Do not
      // reinterpret a later GET failure as a failed reset or invite a retry.
      const response = await resetQuiz(confirmation)
      resetOperation.value = response.reset_operation
      history.value.push({ time: new Date().toISOString(), label: 'クイズ大会をリセット' })
      noticeMessage.value = 'クイズ大会を開始前の状態に戻しました。'
      await refresh(false, true, true)
      return true
    }
    catch (error) {
      resetOperation.value = null
      errorMessage.value = toApiError(error).message
      await refresh(true, true)
      return false
    }
    finally {
      isActing.value = false
    }
  }

  let pollTimer: ReturnType<typeof setInterval> | null = null
  onMounted(() => {
    void refresh()
    pollTimer = setInterval(() => {
      void refresh()
    }, 5_000)
  })
  onUnmounted(() => {
    if (pollTimer !== null) clearInterval(pollTimer)
  })

  const phase = computed(() => state.value && getQuizPhase(state.value))
  const phaseLabel = computed(() => phase.value ? PHASE_LABELS[phase.value] : '')
  const nextQuestionPosition = computed(() => state.value && getNextQuizPosition(state.value))

  return {
    state,
    history,
    isLoading,
    isActing,
    errorMessage,
    noticeMessage,
    resetOperation,
    phase,
    phaseLabel,
    nextQuestionPosition,
    refresh,
    start,
    publish,
    close,
    closeImmediately,
    reveal,
    finish,
    reset,
  }
}
