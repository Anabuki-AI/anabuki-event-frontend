export type QuizEventStatus = 'ACTIVE' | 'FINISHED'
export type QuizQuestionStatus = 'PENDING' | 'PUBLISHED' | 'CLOSED' | 'REVEALED'
export type QuizPhase = 'IDLE' | 'READY' | 'PUBLISHED' | 'CLOSED' | 'REVEALED' | 'FINISHED'
export type ChoiceKey = 'A' | 'B' | 'C' | 'D'

export interface ConfidenceMultipliers {
  high: string
  normal: string
  low: string
}

/** GET /api/operator/quiz/state と進行操作が返すイベント。 */
export interface QuizEvent {
  id: number
  status: QuizEventStatus
  startedAt: string
  finishedAt: string | null
  confidenceMultipliers: ConfidenceMultipliers
}

/** イベント開始時に固定された、運営者向けの問題スナップショット。 */
export interface QuizQuestion {
  id: number
  sourceQuestionId: number
  position: number
  status: QuizQuestionStatus
  questionText: string
  choiceA: string
  choiceB: string
  choiceC: string
  choiceD: string
  correctAnswer: ChoiceKey
  imageUrl: string | null
  basePoints: number
}

/** 運営APIのレスポンスそのもの。画面フェーズは questions から導出する。 */
export interface QuizState {
  event: QuizEvent | null
  questions: QuizQuestion[]
}

export const PHASE_LABELS: Record<QuizPhase, string> = {
  IDLE: 'イベント開始前',
  READY: '問題公開待ち',
  PUBLISHED: '解答受付中',
  CLOSED: '解答締め切り',
  REVEALED: '答え表示中',
  FINISHED: 'イベント終了',
}

export const CHOICE_KEYS = ['A', 'B', 'C', 'D'] as const satisfies readonly ChoiceKey[]

export function getQuizPhase(state: QuizState): QuizPhase {
  if (!state.event) return 'IDLE'
  if (state.event.status === 'FINISHED') return 'FINISHED'

  const currentQuestion = getCurrentQuizQuestion(state)
  if (currentQuestion && currentQuestion.status !== 'PENDING') return currentQuestion.status
  return 'READY'
}

/** PUBLISHED/CLOSED/REVEALED のうち、最も後ろの問題を現在問として扱う。 */
export function getCurrentQuizQuestion(state: QuizState): QuizQuestion | null {
  return [...state.questions]
    .filter(question => question.status !== 'PENDING')
    .sort((left, right) => right.position - left.position)[0] ?? null
}

export function getNextQuizQuestion(state: QuizState): QuizQuestion | null {
  return [...state.questions]
    .filter(question => question.status === 'PENDING')
    .sort((left, right) => left.position - right.position)[0] ?? null
}
