import type { ChoiceKey } from './types'

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
export const CONFIDENCE_MULTIPLIER_DEFAULT = '1.00'

export function formatMultiplier(value: string | number): string {
  const numeric = typeof value === 'number' ? value : Number(value)
  if (Number.isNaN(numeric)) {
    return String(value)
  }
  return numeric.toFixed(CONFIDENCE_MULTIPLIER_SCALE)
}
