import type { ChoiceKey, ConfidenceLevel, ConfidenceMultipliers } from './types'

export const CHOICE_KEYS = ['A', 'B', 'C', 'D'] as const satisfies readonly ChoiceKey[]

export const QUESTION_TEXT_MAX = 200
export const CHOICE_TEXT_MAX = 100

/** 自信度倍率の下限。0 で正解時の配点なし */
export const CONFIDENCE_MULTIPLIER_MIN = 0
/** 自信度倍率の上限。イベントの釣り合いを保つための作業上限 */
export const CONFIDENCE_MULTIPLIER_MAX = 9.99
/** 小数は2桁まで */
export const CONFIDENCE_MULTIPLIER_SCALE = 2
export const CONFIDENCE_MULTIPLIER_STEP = 0.1

/** 自信度3段階。表示・編集の並び順もこれに従う */
export const CONFIDENCE_LEVELS = ['high', 'normal', 'low'] as const satisfies readonly ConfidenceLevel[]

export const CONFIDENCE_LEVEL_LABELS: Record<ConfidenceLevel, string> = {
  high: '自信度あり',
  normal: '自信度普通',
  low: '自信度なし',
}

/** 段階ごとの既定倍率。自信度が高いほどハイリスク・ハイリターンになるよう差をつける */
export const CONFIDENCE_MULTIPLIER_DEFAULTS: ConfidenceMultipliers = {
  high: '2.00',
  normal: '1.00',
  low: '0.50',
}

export function formatMultiplier(value: string | number): string {
  const numeric = typeof value === 'number' ? value : Number(value)
  if (Number.isNaN(numeric)) {
    return String(value)
  }
  return numeric.toFixed(CONFIDENCE_MULTIPLIER_SCALE)
}
