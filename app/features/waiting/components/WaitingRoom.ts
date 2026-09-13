import { useRoute } from '#imports'
import type { Ref } from 'vue'
import { ref, watch } from 'vue'

/**
 * 待機画面全体の状態とイベント(旧WaitingRoom.vueのscript)。
 * テンプレートはpages/users/waiting.vueに統合済み。
 */
export function setupWaitingRoom(participantCount: Ref<number>) {
  // 参加人数が増えた瞬間だけポップアニメーションを1回鳴らす
  const isCountUpdated = ref(false)
  let countTimer: ReturnType<typeof setTimeout> | undefined

  watch(() => participantCount.value, (next, prev) => {
    if (next <= prev) {
      return
    }
    isCountUpdated.value = false
    // クラス付け外しを1フレーム分空けて再トリガーできるようにする
    requestAnimationFrame(() => {
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
  }

  return {
    isCountUpdated,
    lastReactedEmoji,
    handleReact,
  }
}

/**
 * ユーザー登録画面からクエリで受け取ったニックネームを解決する。
 * (旧waiting.vueのscript内ユーティリティ)
 */
export function setupUserName(): Ref<string> {
  const route = useRoute()
  return ref((() => {
    const name = route.query.userName
    return typeof name === 'string' && name.length > 0 ? name : 'ゲスト'
  })())
}
