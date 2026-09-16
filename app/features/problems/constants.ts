import type { ChoiceKey, ConfidenceLevel } from './types'

export const CHOICE_KEYS = ['A', 'B', 'C', 'D'] as const satisfies readonly ChoiceKey[]

export const QUESTION_TEXT_MAX = 200
export const CHOICE_TEXT_MAX = 100

export const CONFIDENCE_MULTIPLIER_MIN = 0
export const CONFIDENCE_MULTIPLIER_MAX = 9.99
export const CONFIDENCE_MULTIPLIER_SCALE = 2
export const CONFIDENCE_MULTIPLIER_STEP = 0.1

export const CONFIDENCE_LEVELS = ['high', 'normal', 'low'] as const satisfies readonly ConfidenceLevel[]

export const CONFIDENCE_LEVEL_LABELS: Record<ConfidenceLevel, string> = {
  high: '自信度あり',
  normal: '自信度普通',
  low: '自信度なし',
}

export function formatMultiplier(value: string | number): string {
  const numeric = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(numeric) ? numeric.toFixed(CONFIDENCE_MULTIPLIER_SCALE) : String(value)
}
