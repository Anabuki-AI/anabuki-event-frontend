import { computed, onMounted, onUnmounted, ref } from 'vue'
import type { OperatorQuizState } from './types'
import { getNextQuizPosition, getQuizPhase, PHASE_LABELS } from './types'
import {
  closeAnswers,
  fetchQuizState,
  finishQuiz,
  publishQuestion,
  revealAnswer,
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
  let refreshPromise: Promise<boolean> | undefined

  async function refresh(preserveError = false, force = false) {
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

  async function act(action: () => Promise<OperatorQuizState>, successNotice: string, historyLabel: string) {
    if (isActing.value) return

    errorMessage.value = ''
    noticeMessage.value = ''
    isActing.value = true
    try {
      await action()
      // 操作レスポンスを表示用の唯一の状態にせず、必ず最新stateを取り直す。
      if (!await refresh(false, true)) return

      history.value.push({ time: new Date().toISOString(), label: historyLabel })
      noticeMessage.value = successNotice
    }
    catch (error) {
      // 422 は不正な遷移(二重start、締切前の公開など)。状態のずれを案内して実態を取り直す。
      errorMessage.value = error instanceof ApiError && error.statusCode === 422
        ? INVALID_TRANSITION_MESSAGE
        : toApiError(error).message
      await refresh(true, true)
    }
    finally {
      isActing.value = false
    }
  }

  const start = () => act(startQuiz, 'イベントを開始しました。', 'イベント開始')

  const publish = () => {
    // 契約どおり publish は position を必須で送る。未公開問題のうち先頭の位置を指定する。
    const position = state.value
      ? (state.value.current?.position ?? 0) + 1
      : 1
    return act(() => publishQuestion(position), `Q${position} を公開しました。参加者は解答できます。`, '問題公開')
  }

  const close = () => act(closeAnswers, '解答の受付を締め切りました。', '解答締め切り')
  const reveal = () => act(revealAnswer, '答えを表示しました。', '答え表示')
  const finish = () => act(finishQuiz, 'クイズ大会を終了しました。', 'クイズ終了')

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
    phase,
    phaseLabel,
    nextQuestionPosition,
    refresh,
    start,
    publish,
    close,
    reveal,
    finish,
  }
}
