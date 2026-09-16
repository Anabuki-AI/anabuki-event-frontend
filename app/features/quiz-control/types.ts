export type QuizPhase = 'IDLE' | 'PUBLISHING' | 'CLOSED' | 'REVEALED' | 'ENDED'

export type ChoiceKey = 'A' | 'B' | 'C' | 'D'

export interface QuizQuestion {
  id: number
  questionText: string
  choices: Record<ChoiceKey, string>
  correctAnswer: ChoiceKey
  /** 自信度倍率。文字列で受け取り表示時に整形する（例: "1.00"） */
  confidenceMultiplier: string
}

export interface QuizState {
  phase: QuizPhase
  currentQuestion: QuizQuestion | null
  nextQuestion: QuizQuestion | null
  totalQuestions: number
  /** ISO 8601 文字列 or null */
  startedAt: string | null
  publishedAt: string | null
  closedAt: string | null
  revealedAt: string | null
}

/** 画面表示用のフェーズラベル */
export const PHASE_LABELS: Record<QuizPhase, string> = {
  IDLE: 'イベント開始前',
  PUBLISHING: '解答受付中',
  CLOSED: '解答締め切り',
  REVEALED: '答え表示中',
  ENDED: 'イベント終了',
}

export const CHOICE_KEYS = ['A', 'B', 'C', 'D'] as const satisfies readonly ChoiceKey[]

/** 自信度倍率を小数2桁の文字列に整形する（"1.5" → "1.50"） */
export function formatMultiplier(value: string | number): string {
  const numeric = typeof value === 'number' ? value : Number(value)
  if (Number.isNaN(numeric)) {
    return String(value)
  }
  return numeric.toFixed(2)
}
