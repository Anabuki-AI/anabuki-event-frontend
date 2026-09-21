import { onUnmounted, ref } from 'vue'
import { reportParticipantReaction } from '../api/report-reaction'
import type { ParticipantReactionEmoji } from '../types'
import { ApiError } from '~/lib/api/error'

/** Local feedback is independent of network latency and the server's rate limit. */
export function useParticipantReactions(onUnauthorized: () => void = () => {}) {
  const lastReactedEmoji = ref<ParticipantReactionEmoji | ''>('')
  let timer: ReturnType<typeof setTimeout> | undefined
  let disposed = false

  function handleReact(emoji: ParticipantReactionEmoji) {
    lastReactedEmoji.value = emoji
    clearTimeout(timer)
    timer = setTimeout(() => { lastReactedEmoji.value = '' }, 500)
    void reportParticipantReaction({ reaction: emoji }).catch((error: unknown) => {
      if (!disposed && error instanceof ApiError && error.statusCode === 401) onUnauthorized()
      // A rate limit or network failure must not interrupt the local animation.
    })
  }

  onUnmounted(() => {
    disposed = true
    clearTimeout(timer)
  })
  return { lastReactedEmoji, handleReact }
}
