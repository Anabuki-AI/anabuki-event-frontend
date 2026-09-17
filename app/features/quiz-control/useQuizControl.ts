import { computed, onMounted, onUnmounted, ref } from 'vue'
import type { QuizState } from './types'
import { getQuizPhase, PHASE_LABELS } from './types'
import {
  closeAnswers,
  fetchQuizState,
  publishQuestion,
  revealAnswer,
  startQuiz,
} from './api/client'
import { toApiError } from '~/lib/api/error'

export interface QuizHistoryEntry {
  time: string
  label: string
}

/** 運営APIの状態を同期し、実際の進行操作を一度ずつ実行する。 */
export function useQuizControl() {
  const state = ref<QuizState | null>(null)
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

  async function act(action: () => Promise<QuizState>, successNotice: string, historyLabel: string) {
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
      errorMessage.value = toApiError(error).message
      // 競合など失敗時も、画面と実態のずれを解消する。
      await refresh(true, true)
    }
    finally {
      isActing.value = false
    }
  }

  const start = () => act(startQuiz, 'イベントを開始しました。', 'イベント開始')
  const publish = () => act(publishQuestion, '問題を公開しました。参加者は解答できます。', '問題公開')
  const close = () => act(closeAnswers, '解答の受付を締め切りました。', '解答締め切り')
  const reveal = () => act(revealAnswer, '答えを表示しました。', '答え表示')

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

  return {
    state,
    history,
    isLoading,
    isActing,
    errorMessage,
    noticeMessage,
    phase,
    phaseLabel,
    refresh,
    start,
    publish,
    close,
    reveal,
  }
}
