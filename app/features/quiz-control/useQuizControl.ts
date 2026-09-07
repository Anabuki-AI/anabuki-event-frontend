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

export function useQuizControl() {
  const state = ref<QuizState | null>(null)
  const isLoading = ref(true)
  const isActing = ref(false)
  const errorMessage = ref('')
  const noticeMessage = ref('')

  async function refresh() {
    try {
      state.value = await fetchQuizState()
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
      state.value = await action()
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
