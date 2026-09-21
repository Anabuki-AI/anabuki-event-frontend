import { computed, onMounted, onUnmounted, ref } from 'vue'
import { fetchQuizState } from '~/features/quiz-control/api/client'
import { getQuizPhase } from '~/features/quiz-control/types'
import type { OperatorQuizState } from '~/features/quiz-control/types'
import { toApiError } from '~/lib/api/error'

/** 大画面は運営者の操作に追従するだけなので、出題管理より短い間隔で読み取り専用ポーリングする。 */
export const PROJECTOR_POLL_INTERVAL_MS = 2_000

/** 正解・解説を映してよいか。運営stateは常に correct_answer を含むため、必ずここで絞る。 */
export function isProjectorAnswerVisible(state: OperatorQuizState | null): boolean {
  if (!state?.current) return false
  const phase = getQuizPhase(state)
  return phase === 'REVEALED' || phase === 'FINISHED'
}

export function useProjectorQuiz() {
  const state = ref<OperatorQuizState | null>(null)
  const isLoading = ref(true)
  const errorMessage = ref('')
  let timer: ReturnType<typeof setInterval> | null = null
  let inFlight = false

  async function refresh() {
    if (inFlight) return
    inFlight = true
    try {
      state.value = await fetchQuizState()
      errorMessage.value = ''
    }
    catch (error) {
      errorMessage.value = toApiError(error).message
    }
    finally {
      isLoading.value = false
      inFlight = false
    }
  }

  onMounted(() => {
    void refresh()
    timer = setInterval(() => void refresh(), PROJECTOR_POLL_INTERVAL_MS)
  })
  onUnmounted(() => {
    if (timer !== null) clearInterval(timer)
  })

  const phase = computed(() => state.value && getQuizPhase(state.value))
  const isAnswerVisible = computed(() => isProjectorAnswerVisible(state.value))

  return { state, phase, isLoading, errorMessage, isAnswerVisible, refresh }
}
