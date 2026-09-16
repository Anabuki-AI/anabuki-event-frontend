import { onMounted, onUnmounted, ref } from 'vue'
import { reportParticipantPresence } from '../api/report-presence'

export const PARTICIPANT_PRESENCE_POLL_INTERVAL_MS = 20_000

/**
 * Reports the participant's presence and keeps the waiting-room count current.
 * Polling runs only while the document is visible.
 */
export function useParticipantPresence() {
  const participantCount = ref<number | null>(null)
  const isRefreshing = ref(false)
  let pollTimer: ReturnType<typeof setInterval> | undefined

  async function refresh() {
    if (isRefreshing.value) {
      return
    }

    isRefreshing.value = true
    try {
      const presence = await reportParticipantPresence()
      participantCount.value = presence.activeParticipantCount
    }
    catch {
      // Keep the most recently confirmed count when a transient request fails.
    }
    finally {
      isRefreshing.value = false
    }
  }

  function startPolling() {
    if (pollTimer === undefined) {
      pollTimer = setInterval(() => {
        void refresh()
      }, PARTICIPANT_PRESENCE_POLL_INTERVAL_MS)
    }
  }

  function stopPolling() {
    if (pollTimer !== undefined) {
      clearInterval(pollTimer)
      pollTimer = undefined
    }
  }

  function handleVisibilityChange() {
    if (document.visibilityState === 'visible') {
      void refresh()
      startPolling()
    }
    else {
      stopPolling()
    }
  }

  onMounted(() => {
    document.addEventListener('visibilitychange', handleVisibilityChange)
    if (document.visibilityState === 'visible') {
      void refresh()
      startPolling()
    }
  })

  onUnmounted(() => {
    stopPolling()
    document.removeEventListener('visibilitychange', handleVisibilityChange)
  })

  return {
    participantCount,
    isRefreshing,
    refresh,
  }
}
