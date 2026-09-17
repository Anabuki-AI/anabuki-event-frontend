import type { ChoiceKey, ConfidenceLevel } from './types'

export const CHOICE_KEYS = ['A', 'B', 'C', 'D'] as const satisfies readonly ChoiceKey[]

export const QUESTION_TEXT_MAX = 200
export const CHOICE_TEXT_MAX = 100
export const EXPLANATION_MAX = 500
export const TARGET_AUDIENCE_MAX = 100

export const QUESTION_POINTS_MIN = 1
export const QUESTION_POINTS_MAX = 1000
export const QUESTION_POINTS_DEFAULT = 100
export const TIME_LIMIT_SECONDS_MAX = 2_147_483_647

export const IMAGE_MAX_BYTES = 5 * 1024 * 1024
export const ALLOWED_IMAGE_TYPES = ['image/webp']

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
