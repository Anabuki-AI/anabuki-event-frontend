export type AnswerChoice = 'A' | 'B' | 'C' | 'D'
export type QuizSessionStatus = 'waiting' | 'in_progress' | 'finished'
export type QuizSessionPhase = 'answering' | 'closing' | 'closed' | 'revealed'

/** バックエンドの confidence_multipliers で使用する自信度キー。 */
export type ConfidenceLevel = 'high' | 'normal' | 'low'

export interface ParticipantQuizQuestion {
  question_id: number
  position: number
  question_text: string
  /** Lv.1確定後は、サーバーが不正解の選択肢を1つ除外して3択を返す。 */
  choices: Partial<Record<AnswerChoice, string>>
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
  /** 現在のフェーズが始まったサーバー時刻。closing 時は10秒カウントダウンの基準。 */
  phase_started_at?: string | null
  question: ParticipantQuizQuestion | null
  answered: boolean
  my_answer: ParticipantQuizMyAnswer | null
  /** phase=revealed のときだけ文字列で返る。 */
  correct_answer: AnswerChoice | null
  confidence_multipliers?: { high: number; normal: number; low: number }
  /** 回答前に一度だけサーバーへ確定した自信度。 */
  confidence_level?: ConfidenceLevel | null
  confidence_locked?: boolean
}

export interface ConfirmParticipantQuizConfidenceInput {
  question_id: number
  confidence_level: ConfidenceLevel
}

export interface SubmitParticipantQuizAnswerInput {
  question_id: number
  choice: AnswerChoice
}

/** POST /api/participant/quiz/answers のレスポンス(更新後の my_answer)。 */
export interface SubmitParticipantQuizAnswerResult {
  my_answer: ParticipantQuizMyAnswer
}

export const CONFIDENCE_LEVEL_LABELS: Record<ConfidenceLevel, string> = {
  low: 'Lv.1',
  normal: 'Lv.2',
  high: 'Lv.3',
}
