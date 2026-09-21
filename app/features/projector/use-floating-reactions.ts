import { onUnmounted, ref, watch } from 'vue'
import type { Ref } from 'vue'
import { fetchReactionFeed } from './api/reactions'
import { FLOAT_CONFIG, appendWithLimit, createFloatingReaction } from './floating-reactions'
import type { FloatingReaction } from './types'

/**
 * 大画面用: enabled(待機中)の間だけリアクションフィードをポーリングし、浮かせる要素を返す。
 * enabled が false になったら購読を止めて全要素を消し、カーソルも捨てる(再開時に過去分を再生しない)。
 */
export function useFloatingReactions(enabled: Ref<boolean>) {
  const floaters = ref<FloatingReaction[]>([])
  let cursor: string | null = null
  let timer: ReturnType<typeof setInterval> | null = null
  let inFlight = false
  let generation = 0

  async function poll() {
    if (inFlight) return
    inFlight = true
    const startedIn = generation
    try {
      const feed = await fetchReactionFeed(cursor)
      if (startedIn !== generation) return // 停止/再開をまたいだ古い応答は捨てる
      const first = cursor === null
      cursor = feed.cursor
      if (first || feed.reactions.length === 0) return
      const added = feed.reactions.map(event => createFloatingReaction(event, Math.random, true))
      floaters.value = appendWithLimit(floaters.value, added)
    }
    catch {
      // 演出は付加機能。失敗しても次のポーリングで再試行するだけで画面は乱さない。
    }
    finally {
      inFlight = false
    }
  }

  function stop() {
    generation++
    if (timer !== null) clearInterval(timer)
    timer = null
    cursor = null
    floaters.value = []
  }

  function start() {
    stop()
    void poll()
    timer = setInterval(() => void poll(), FLOAT_CONFIG.pollIntervalMs)
  }

  /** アニメーション終了(または保険タイマー)でDOMから確実に外す。 */
  function remove(key: number) {
    floaters.value = floaters.value.filter(item => item.key !== key)
  }

  watch(enabled, on => (on ? start() : stop()), { immediate: true })
  onUnmounted(stop)

  return { floaters, remove }
}
