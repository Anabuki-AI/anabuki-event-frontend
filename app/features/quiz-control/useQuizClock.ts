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

/** 残り時間の視覚的な警告状態。 */
export type CountdownUrgency = 'none' | 'normal' | 'warning' | 'expired'

/** 残り時間の割合がこの値以下になったら「残りわずか」の警告状態にする。 */
const WARNING_RATIO_THRESHOLD = 0.25

export interface QuizCountdown {
  /** 制限時間(time_limit_seconds)が設定されているか。 */
  hasLimit: boolean
  /** 残り秒数。制限時間がない場合は null。 */
  remainingSeconds: number | null
  /** MM:SS 形式。制限時間がない場合は '--:--'。 */
  remainingLabel: string
  /** 残り時間の割合(0〜1)。制限時間がない場合は null。 */
  remainingRatio: number | null
  urgency: CountdownUrgency
}

const NO_LIMIT_COUNTDOWN: QuizCountdown = {
  hasLimit: false,
  remainingSeconds: null,
  remainingLabel: '--:--',
  remainingRatio: null,
  urgency: 'none',
}

/**
 * phase_started_at からの経過時間と time_limit_seconds を突き合わせ、
 * カウントダウン表示に必要な値をまとめて算出する純粋関数。
 * time_limit_seconds か phase_started_at のどちらかが null/undefined なら「制限時間なし」を返す。
 */
export function computeCountdown(
  phaseStartedAt: string | null | undefined,
  timeLimitSeconds: number | null | undefined,
  now: Date,
): QuizCountdown {
  if (timeLimitSeconds == null || phaseStartedAt == null) {
    return NO_LIMIT_COUNTDOWN
  }

  const start = new Date(phaseStartedAt)
  const elapsedSeconds = Math.max(0, Math.floor((now.getTime() - start.getTime()) / 1000))
  const remainingSeconds = Math.max(0, timeLimitSeconds - elapsedSeconds)
  const minutes = Math.floor(remainingSeconds / 60)
  const seconds = remainingSeconds % 60
  const remainingLabel = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
  const remainingRatio = timeLimitSeconds > 0 ? remainingSeconds / timeLimitSeconds : 0

  let urgency: CountdownUrgency = 'normal'
  if (remainingSeconds <= 0) urgency = 'expired'
  else if (remainingRatio <= WARNING_RATIO_THRESHOLD) urgency = 'warning'

  return { hasLimit: true, remainingSeconds, remainingLabel, remainingRatio, urgency }
}

/**
 * 残り時間が0になった瞬間に一度だけ処理を実行させるためのガード。
 * key(例: フェーズ開始時刻や問題ID)が変わるたびに新しいフェーズ/問題とみなし、再度1回だけ発火できるようにする。
 * Vueの反応性システムに依存しない純粋なオブジェクトなので、コンポーネントに組み込まずに単体テストできる。
 */
export function createExpireGuard() {
  let firedKey: string | null = null
  return {
    /**
     * 残り時間が0で、かつ同じkeyでまだ発火していなければtrueを返し、以後このkeyでは発火済みとする。
     * それ以外(残り時間が0でない、またはこのkeyで発火済み)はfalseを返す。
     */
    shouldFire(key: string, remainingSeconds: number | null): boolean {
      if (remainingSeconds !== 0) return false
      if (firedKey === key) return false
      firedKey = key
      return true
    },
    /** 明示的にガードを解除する(主にテスト用)。 */
    reset(): void {
      firedKey = null
    },
  }
}
