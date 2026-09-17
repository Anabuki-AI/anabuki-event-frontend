export interface QuestionChoice {
  value: string
  label: string
}

/** GET /api/operator/voting-rate の問題ごとの解答状況。 */
export interface VotingRateQuestion {
  questionId: number
  position: number
  answeredCount: number
  /** 0〜1 の小数。 */
  answeredRate: number
}

/** 投票率APIのレスポンス(契約: docs/quiz-session-contract.md)。 */
export interface VotingRateResponse {
  questions: VotingRateQuestion[]
  total_participants: number
}
