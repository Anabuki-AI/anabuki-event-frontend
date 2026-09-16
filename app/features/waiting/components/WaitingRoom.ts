import type { Ref } from 'vue'
import { onUnmounted, ref, watch } from 'vue'
import { reportParticipantReaction } from '~/features/participants/api/report-reaction'

/**
 * 待機画面の参加人数・リアクション表示の状態を管理する。
 * テンプレートはpages/participants/waiting.vueに統合済み。
 */
export function setupWaitingRoom(participantCount: Ref<number | null>) {
  // 参加人数が増えた瞬間だけポップアニメーションを1回鳴らす
  const isCountUpdated = ref(false)
  let countTimer: ReturnType<typeof setTimeout> | undefined
  let countAnimationFrame: number | undefined

  watch(() => participantCount.value, (next, previous) => {
    // 初回取得と減少時にはアニメーションさせない。
    if (next === null || previous === null || next <= previous) {
      return
    }
    isCountUpdated.value = false
    // クラス付け外しを1フレーム分空けて再トリガーできるようにする
    countAnimationFrame = requestAnimationFrame(() => {
      isCountUpdated.value = true
      clearTimeout(countTimer)
      countTimer = setTimeout(() => {
        isCountUpdated.value = false
      }, 500)
    })
  })

  // 押された絵文字だけをバウンドさせる
  const lastReactedEmoji = ref('')
  let reactionTimer: ReturnType<typeof setTimeout> | undefined

  function handleReact(emoji: string) {
    lastReactedEmoji.value = emoji
    clearTimeout(reactionTimer)
    reactionTimer = setTimeout(() => {
      lastReactedEmoji.value = ''
    }, 500)

    // Sending is deliberately fire-and-forget so network failures never delay local feedback.
    // Add retry or error UI here later without changing the reaction animation behavior.
    void reportParticipantReaction({ reaction: emoji }).catch(() => {
      // Intentionally silent until retry or error feedback is designed.
    })
  }

  onUnmounted(() => {
    if (countAnimationFrame !== undefined) {
      cancelAnimationFrame(countAnimationFrame)
    }
    clearTimeout(countTimer)
    clearTimeout(reactionTimer)
  })

  return {
    isCountUpdated,
    lastReactedEmoji,
    handleReact,
  }
}