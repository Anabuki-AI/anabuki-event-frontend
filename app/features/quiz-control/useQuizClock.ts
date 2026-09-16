/** 現在時刻を一定間隔で更新する composable */
export function useQuizClock(intervalMs = 1000) {
  const now = ref(new Date())

  let timer: ReturnType<typeof setInterval> | null = null

  onMounted(() => {
    timer = setInterval(() => {
      now.value = new Date()
    }, intervalMs)
  })

  onUnmounted(() => {
    if (timer !== null) {
      clearInterval(timer)
      timer = null
    }
  })

  return { now }
}

/** ISO文字列 or Date から経過時間を MM:SS 形式で整形する */
export function formatElapsed(from: string | Date | null, now: Date): string {
  if (from === null) {
    return '--:--'
  }
  const start = typeof from === 'string' ? new Date(from) : from
  const elapsedSeconds = Math.max(0, Math.floor((now.getTime() - start.getTime()) / 1000))
  const minutes = Math.floor(elapsedSeconds / 60)
  const seconds = elapsedSeconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

/** Date を HH:MM:SS 形式で整形する */
export function formatClock(date: Date): string {
  const h = String(date.getHours()).padStart(2, '0')
  const m = String(date.getMinutes()).padStart(2, '0')
  const s = String(date.getSeconds()).padStart(2, '0')
  return `${h}:${m}:${s}`
}
