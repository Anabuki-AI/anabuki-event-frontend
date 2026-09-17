import { onBeforeUnmount, onMounted, ref } from 'vue'
import { fetchParticipantQuizState } from '../api/client'
import type { ParticipantQuizState } from '../types'

export const PARTICIPANT_QUIZ_POLL_INTERVAL_MS = 5_000

type StateLoader = () => Promise<ParticipantQuizState>

export interface ParticipantQuizPollerOptions {
  loadState: StateLoader
  onState: (state: ParticipantQuizState) => void
  onError: (error: unknown) => void
  document?: Document
}

/**
 * 画面が可視の間だけ状態を5秒ごとに読み込む。通信中に次のtickが来ても重複させない。
 * composable から分離して、ライフサイクルに依存せずポーリング規約をテストできるようにする。
 */
export function createParticipantQuizPoller(options: ParticipantQuizPollerOptions) {
  let timer: ReturnType<typeof setInterval> | undefined
  let started = false
  let loading = false

  const isVisible = () => !options.document || options.document.visibilityState === 'visible'

  const refresh = async () => {
    if (!isVisible() || loading) return

    loading = true
    try {
      options.onState(await options.loadState())
    }
    catch (error) {
      options.onError(error)
    }
    finally {
      loading = false
    }
  }

  const stopTimer = () => {
    if (timer) clearInterval(timer)
    timer = undefined
  }

  const startTimer = () => {
    if (timer) return
    timer = setInterval(() => {
      void refresh()
    }, PARTICIPANT_QUIZ_POLL_INTERVAL_MS)
  }

  const handleVisibilityChange = () => {
    if (!isVisible()) {
      stopTimer()
      return
    }

    void refresh()
    startTimer()
  }

  const start = () => {
    if (started) return

    started = true
    options.document?.addEventListener('visibilitychange', handleVisibilityChange)
    if (!isVisible()) return

    void refresh()
    startTimer()
  }

  const stop = () => {
    if (!started) return

    started = false
    stopTimer()
    options.document?.removeEventListener('visibilitychange', handleVisibilityChange)
  }

  return { refresh, start, stop }
}

export interface UseParticipantQuizStateOptions {
  onState?: (state: ParticipantQuizState) => void
  onError?: (error: unknown) => void
}

/** 参加者クイズの状態を、コンポーネント破棄時まで可視タブだけで同期する。 */
export function useParticipantQuizState(options: UseParticipantQuizStateOptions = {}) {
  const state = ref<ParticipantQuizState>()
  const isLoading = ref(true)
  const loadError = ref<unknown>()

  const poller = createParticipantQuizPoller({
    loadState: fetchParticipantQuizState,
    document: import.meta.client ? document : undefined,
    onState: (nextState) => {
      state.value = nextState
      loadError.value = undefined
      isLoading.value = false
      options.onState?.(nextState)
    },
    onError: (error) => {
      loadError.value = error
      isLoading.value = false
      options.onError?.(error)
    },
  })

  onMounted(poller.start)
  onBeforeUnmount(poller.stop)

  return {
    state,
    isLoading,
    loadError,
    refresh: poller.refresh,
  }
}
