import type { FloatingReaction, ProjectorReactionEvent } from './types'

/**
 * 大画面のリアクション浮遊演出の調整パラメータ。
 * 見た目を変えたい場合はここだけ触ればよい(CSSは変数経由で受け取る)。
 */
export const FLOAT_CONFIG = {
  /** フィード取得間隔 */
  pollIntervalMs: 1_000,
  /** 同時に画面へ出す上限。超えた分は新しいもの優先で古いものを消す */
  maxConcurrent: 40,
  /** 1回の取得でまとめて届いた分を散らす最大遅延 */
  spreadMs: 900,
  /** 上昇〜消滅までの時間の範囲 */
  durationMs: [2_600, 4_200] as const,
  /** 絵文字サイズ(px)の範囲 */
  sizePx: [40, 84] as const,
  /** 出現X位置(vw %)の範囲。端で見切れないよう余白を持つ */
  leftPct: [6, 94] as const,
  /** 横揺れ幅(px)の範囲 */
  swayPx: [16, 60] as const,
  /** 終点の横ずれ(px)の絶対値上限 */
  driftPx: 120,
  /** アニメーションが終了イベントを出さなかった時の保険削除までの追加時間 */
  cleanupGraceMs: 800,
}

const between = (rand: () => number, [min, max]: readonly [number, number]) => min + rand() * (max - min)

let nextKey = 1

/** 1件のリアクションから浮遊要素の初期値を作る。rand は 0以上1未満を返す関数(テストで差し替え可)。 */
export function createFloatingReaction(
  event: Pick<ProjectorReactionEvent, 'reaction'>,
  rand: () => number = Math.random,
  spread = false,
): FloatingReaction {
  const sign = rand() < 0.5 ? -1 : 1
  return {
    key: nextKey++,
    emoji: event.reaction,
    left: between(rand, FLOAT_CONFIG.leftPct),
    sway: between(rand, FLOAT_CONFIG.swayPx) * sign,
    drift: (rand() * 2 - 1) * FLOAT_CONFIG.driftPx,
    size: Math.round(between(rand, FLOAT_CONFIG.sizePx)),
    duration: Math.round(between(rand, FLOAT_CONFIG.durationMs)),
    delay: spread ? Math.round(rand() * FLOAT_CONFIG.spreadMs) : 0,
  }
}

/** 同時表示数の上限を守る。あふれたら古い(先頭)ものから捨てる。 */
export function appendWithLimit(
  current: FloatingReaction[],
  added: FloatingReaction[],
  max: number = FLOAT_CONFIG.maxConcurrent,
): FloatingReaction[] {
  const merged = [...current, ...added]
  return merged.length > max ? merged.slice(merged.length - max) : merged
}
