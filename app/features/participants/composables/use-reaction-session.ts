import { computed, onMounted, onUnmounted, ref, watch, type Ref } from 'vue'
import { getCurrentParticipant } from '../api/get-current-participant'

const allowedPaths = new Set([
  '/', '/help', '/rankings',
  '/participants/waiting', '/participants/edit', '/participants/help',
])

export function allowsParticipantReactions(path: string): boolean {
  return allowedPaths.has(path.replace(/\/+$/, '') || '/')
}

/** Never navigate on failure: this host also lives on public pages. */
export function useReactionSession(path: Ref<string>) {
  const confirmedPath = ref<string | null>(null)
  let generation = 0
  let stop: (() => void) | undefined

  function invalidate() {
    generation++
    confirmedPath.value = null
  }

  async function refresh() {
    invalidate()
    const requestGeneration = generation
    const requestedPath = path.value
    if (!allowsParticipantReactions(requestedPath)) return
    try {
      const participant = await getCurrentParticipant()
      if (participant && generation === requestGeneration && path.value === requestedPath) {
        confirmedPath.value = requestedPath
      }
    }
    catch {
      // No session, an expired session or a failed check all keep the host hidden.
    }
  }

  function onVisibilityChange() {
    if (document.visibilityState === 'visible') void refresh()
    else invalidate()
  }

  onMounted(() => {
    stop = watch(path, refresh, { immediate: true, flush: 'sync' })
    window.addEventListener('focus', refresh)
    document.addEventListener('visibilitychange', onVisibilityChange)
  })
  onUnmounted(() => {
    invalidate()
    stop?.()
    window.removeEventListener('focus', refresh)
    document.removeEventListener('visibilitychange', onVisibilityChange)
  })

  const canReact = computed(() => allowsParticipantReactions(path.value) && confirmedPath.value === path.value)
  return { canReact, invalidate }
}
