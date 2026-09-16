import { computed, onMounted, onUnmounted, ref } from 'vue'
import type { QuizState } from './types'
import { PHASE_LABELS } from './types'
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

export function useQuizControl() {
  const state = ref<QuizState | null>(null)
  const isLoading = ref(true)
  const isActing = ref(false)
  const errorMessage = ref('')
  const noticeMessage = ref('')

  // 各フェーズの時刻はQuizStateが現在の問題分しか持たない（次の問題で上書き/リセットされる）ため、
  // 「問題ごとに何時何が起きたか」を追えるよう、変化を検知したら履歴として蓄積する
  const history = ref<QuizHistoryEntry[]>([])
  let lastStartedAt: string | null = null
  let lastPublishedAt: string | null = null
  let lastClosedAt: string | null = null
  let lastRevealedAt: string | null = null

  function recordHistory(next: QuizState) {
    const questionLabel = next.currentQuestion ? `Q${next.currentQuestion.id}` : null

    if (next.startedAt && next.startedAt !== lastStartedAt) {
      lastStartedAt = next.startedAt
      history.value.push({ time: next.startedAt, label: 'イベント開始' })
    }
    if (next.publishedAt && next.publishedAt !== lastPublishedAt) {
      lastPublishedAt = next.publishedAt
      history.value.push({ time: next.publishedAt, label: questionLabel ? `${questionLabel} 問題公開` : '問題公開' })
    }
    if (next.closedAt && next.closedAt !== lastClosedAt) {
      lastClosedAt = next.closedAt
      history.value.push({ time: next.closedAt, label: questionLabel ? `${questionLabel} 解答締め切り` : '解答締め切り' })
    }
    if (next.revealedAt && next.revealedAt !== lastRevealedAt) {
      lastRevealedAt = next.revealedAt
      history.value.push({ time: next.revealedAt, label: questionLabel ? `${questionLabel} 答え表示` : '答え表示' })
    }
  }

  async function refresh() {
    try {
      const next = await fetchQuizState()
      state.value = next
      recordHistory(next)
    }
    catch (error) {
      errorMessage.value = toApiError(error).message
    }
    finally {
      isLoading.value = false
    }
  }

  async function act(action: () => Promise<QuizState>, successNotice: string) {
    errorMessage.value = ''
    noticeMessage.value = ''
    isActing.value = true
    try {
      const next = await action()
      state.value = next
      recordHistory(next)
      noticeMessage.value = successNotice
    }
    catch (error) {
      errorMessage.value = toApiError(error).message
      // 失敗時も最新状態に同期して画面と実態のずれを防ぐ
      await refresh()
    }
    finally {
      isActing.value = false
    }
  }

  const start = () => act(startQuiz, 'イベントを開始しました。')
  const publish = () => act(publishQuestion, '問題を公開しました。参加者は解答できます。')
  const close = () => act(closeAnswers, '解答の受付を締め切りました。')
  const reveal = () => act(revealAnswer, '答えを表示しました。')

  // 5秒ごとに状態を同期（他管理者の操作を反映。モック時は再取得されるだけ）
  let pollTimer: ReturnType<typeof setInterval> | null = null
  onMounted(() => {
    refresh()
    pollTimer = setInterval(refresh, 5000)
  })
  onUnmounted(() => {
    if (pollTimer !== null) {
      clearInterval(pollTimer)
      pollTimer = null
    }
  })

  const phaseLabel = computed(() => state.value ? PHASE_LABELS[state.value.phase] : '')

  return {
    state,
    history,
    isLoading,
    isActing,
    errorMessage,
    noticeMessage,
    phaseLabel,
    refresh,
    start,
    publish,
    close,
    reveal,
  }
}
