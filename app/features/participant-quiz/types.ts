export type AnswerChoice = 'A' | 'B' | 'C' | 'D'
export type QuizSessionStatus = 'waiting' | 'in_progress' | 'finished'
export type QuizSessionPhase = 'answering' | 'closed' | 'revealed'

/**
 * confidence_multipliers の level。数値が大きいほど高い自信度
 * (3=高い / 2=普通 / 1=低い)。
 */
export type ConfidenceLevel = 1 | 2 | 3

export interface ParticipantQuizQuestion {
  question_id: number
  position: number
  question_text: string
  choices: Record<AnswerChoice, string>
  image_url: string | null
}

export interface ParticipantQuizMyAnswer {
  choice: AnswerChoice
  confidence_level: ConfidenceLevel
}

/** GET /api/participant/quiz/state のレスポンス(契約: docs/quiz-session-contract.md)。 */
export interface ParticipantQuizState {
  status: QuizSessionStatus
  phase: QuizSessionPhase | null
  question: ParticipantQuizQuestion | null
  answered: boolean
  my_answer: ParticipantQuizMyAnswer | null
  /** phase=revealed のときだけ文字列で返る。 */
  correct_answer: AnswerChoice | null
  confidence_multipliers?: { high: number; normal: number; low: number }
}

export interface SubmitParticipantQuizAnswerInput {
  question_id: number
  choice: AnswerChoice
  confidence_level: ConfidenceLevel
}

/** POST /api/participant/quiz/answers のレスポンス(更新後の my_answer)。 */
export interface SubmitParticipantQuizAnswerResult {
  my_answer: ParticipantQuizMyAnswer
}

export const CONFIDENCE_LEVEL_LABELS: Record<ConfidenceLevel, string> = {
  3: 'あり',
  2: '普通',
  1: 'なし',
}
