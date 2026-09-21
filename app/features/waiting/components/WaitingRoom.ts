import type { Ref } from 'vue'
import { onUnmounted, ref, watch } from 'vue'

/** 待機画面の参加人数表示の状態を管理する。 */
export function setupWaitingRoom(participantCount: Ref<number | null>) {
  const isCountUpdated = ref(false)
  let countTimer: ReturnType<typeof setTimeout> | undefined
  let countAnimationFrame: number | undefined

  watch(() => participantCount.value, (next, previous) => {
    // 初回取得と減少時にはアニメーションさせない。
    if (next === null || previous === null || next <= previous) return
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

  onUnmounted(() => {
    if (countAnimationFrame !== undefined) cancelAnimationFrame(countAnimationFrame)
    clearTimeout(countTimer)
  })

  return { isCountUpdated }
}
