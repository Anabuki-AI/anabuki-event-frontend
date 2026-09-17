export type QuizSessionStatus = 'waiting' | 'in_progress' | 'finished'
export type QuizSessionPhase = 'answering' | 'closed' | 'revealed'
export type QuizPhase = 'IDLE' | 'PUBLISHED' | 'CLOSED' | 'REVEALED' | 'FINISHED'
export type ChoiceKey = 'A' | 'B' | 'C' | 'D'

/** GET /api/operator/quiz/state の current。phase が進むと correct_answer も開示される。 */
export interface OperatorQuizCurrentQuestion {
  question_id: number
  position: number
  question_text: string
  choices: Record<ChoiceKey, string>
  image_url: string | null
  correct_answer: ChoiceKey
  answered_count: number
  /** 0〜1 の小数。 */
  answered_rate: number
}

/** クイズ本番セッションAPI契約(Phase 0)どおりの運営者向けレスポンス。 */
export interface OperatorQuizState {
  status: QuizSessionStatus
  phase: QuizSessionPhase | null
  current: OperatorQuizCurrentQuestion | null
  question_count: number
  total_participants: number
}

export const PHASE_LABELS: Record<QuizPhase, string> = {
  IDLE: 'イベント開始前',
  PUBLISHED: '解答受付中',
  CLOSED: '解答締め切り',
  REVEALED: '答え表示中',
  FINISHED: 'イベント終了',
}

export const CHOICE_KEYS = ['A', 'B', 'C', 'D'] as const satisfies readonly ChoiceKey[]

/** APIのstatus/phaseを画面の進行フェーズへ変換する。 */
export function getQuizPhase(state: OperatorQuizState): QuizPhase {
  if (state.status === 'waiting') return 'IDLE'
  if (state.status === 'finished') return 'FINISHED'
  switch (state.phase) {
    case 'closed':
      return 'CLOSED'
    case 'revealed':
      return 'REVEALED'
    default:
      return 'PUBLISHED'
  }
}

/** まだ公開されていない次の問題の位置。終了済み・最終問なら null。 */
export function getNextQuizPosition(state: OperatorQuizState): number | null {
  if (state.status !== 'in_progress' || state.current === null) return null
  const next = state.current.position + 1
  return next <= state.question_count ? next : null
}
