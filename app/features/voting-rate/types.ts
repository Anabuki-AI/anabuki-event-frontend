export interface QuestionChoice {
  value: string
  label: string
}

/** GET /api/operator/voting-rate の wire format (Rails JSON, snake_case). */
export interface VotingRateQuestionWire {
  question_id: number
  position: number
  answered_count: number
  /** 0〜1 の小数。 */
  answered_rate: number
}

export interface VotingRateResponseWire {
  questions: VotingRateQuestionWire[]
  total_participants: number
}

/** 投票率APIの画面用DTO。 */
export interface VotingRateQuestion {
  questionId: number
  position: number
  answeredCount: number
  answeredRate: number
}

export interface VotingRateResponse {
  questions: VotingRateQuestion[]
  totalParticipants: number
}
