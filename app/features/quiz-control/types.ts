import type { ChoiceKey } from '~/features/problems/types'

export type QuizPhase = 'IDLE' | 'PUBLISHING' | 'CLOSED' | 'REVEALED' | 'ENDED'

export interface Question {
  id: number
  questionText: string
  choices: Record<ChoiceKey, string>
  correctAnswer: ChoiceKey
  confidenceMultiplier: string
}

export interface QuizState {
  phase: QuizPhase
  currentQuestion: Question | null
  nextQuestion: Question | null
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
