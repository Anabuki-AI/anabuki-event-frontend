export type AnswerChoice = 'A' | 'B' | 'C' | 'D'
export type ConfidenceLevel = 'high' | 'normal' | 'low'
export type QuizEventStatus = 'ACTIVE' | 'FINISHED'
export type QuizQuestionStatus = 'PENDING' | 'PUBLISHED' | 'CLOSED' | 'REVEALED'

export interface ConfidenceMultipliers {
  high: string
  normal: string
  low: string
}

export interface ParticipantQuizAnswer {
  id: number
  quizEventQuestionId: number
  answer: AnswerChoice
  confidenceLevel: ConfidenceLevel
  submittedAt: string
  /** REVEALED の問題だけで返る。 */
  isCorrect?: boolean
  /** REVEALED の問題だけで返る文字列小数の得点。 */
  points?: string
}

export interface ParticipantQuizEvent {
  id: number
  status: QuizEventStatus
  startedAt: string
  finishedAt: string | null
  totalQuestions: number
  revealedQuestionCount: number
  confidenceMultipliers: ConfidenceMultipliers
  /** 少なくとも1問が REVEALED のときだけで返る文字列小数の累計得点。 */
  totalScore?: string
}

export interface ParticipantQuizQuestion {
  id: number
  position: number
  status: QuizQuestionStatus
  questionText: string
  choiceA: string
  choiceB: string
  choiceC: string
  choiceD: string
  imageUrl: string | null
  myAnswer?: ParticipantQuizAnswer
  /** REVEALED の問題だけで返る。 */
  correctAnswer?: AnswerChoice
}

export interface ParticipantQuizState {
  event: ParticipantQuizEvent | null
  question: ParticipantQuizQuestion | null
}

export interface SubmitParticipantQuizAnswerInput {
  quizEventQuestionId: number
  answer: AnswerChoice
  confidenceLevel: ConfidenceLevel
}
