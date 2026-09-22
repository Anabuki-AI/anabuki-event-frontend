export type QuizSessionStatus = 'waiting' | 'in_progress' | 'finished'
export type QuizSessionPhase = 'answering' | 'closing' | 'closed' | 'revealed'
export type QuizPhase = 'IDLE' | 'PUBLISHED' | 'CLOSING' | 'CLOSED' | 'REVEALED' | 'FINISHED'
export type ChoiceKey = 'A' | 'B' | 'C' | 'D'

/** GET /api/operator/quiz/state の current。phase が進むと correct_answer も開示される。 */
export interface OperatorQuizCurrentQuestion {
  question_id: number
  position: number
  question_text: string
  choices: Record<ChoiceKey, string>
  image_url: string | null
  /** True when the current live question is a relay question. */
  is_relay_question?: boolean
  /** True when this relay question is the one the operator picked to ask now. */
  is_selected_relay_question?: boolean
  /** ISO8601。答えが参加者に公開済みなら値が入る。 */
  revealed_at?: string | null
  /**
   * 中継問題について、運営がライブ中に明示的に正解を確定させたかどうか。
   * false のままだと correct_answer は作成/編集時点の暫定値の可能性がある。
   */
  live_correct_answer_confirmed?: boolean
  correct_answer: ChoiceKey
  /** 問題の解説。未設定なら null。 */
  explanation?: string | null
  /** 出題対象。未設定/任意項目のため null もありうる。 */
  target_audience?: string | null
  answered_count: number
  /** 0〜1 の小数。 */
  answered_rate: number
  /**
   * この問題の制限時間(秒)。null なら制限時間なし。
   * バックエンドPR未マージ時は未定義になりうるため呼び出し側は必ず ?? null で扱うこと。
   */
  time_limit_seconds?: number | null
}

/** GET /api/operator/quiz/state の next_question。correct_answer は含まれない。 */
export interface OperatorNextQuestion {
  question_id: number
  position: number
  question_text: string
  choices: Record<ChoiceKey, string>
  image_url: string | null
  /** 出題対象。未設定/任意項目のため null もありうる。 */
  target_audience?: string | null
}

/** POST /api/operator/quiz/reset が返す完了済みリセットの受付票。 */
export interface OperatorQuizResetOperation {
  operation_id: string
  started_at: string
  completed_at: string
  affected_rows: {
    participant_answers: number
    confidence_selections: number
    participant_sessions: number
    participants: number
    question_reveals: number
    quiz_sessions: number
  }
}

/** クイズ本番セッションAPI契約(Phase 0)どおりの運営者向けレスポンス。 */
export interface OperatorQuizState {
  status: QuizSessionStatus
  phase: QuizSessionPhase | null
  current: OperatorQuizCurrentQuestion | null
  question_count: number
  total_participants: number
  /**
   * 現在のフェーズが始まった時刻(ISO8601)。
   * バックエンドPR未マージ時は未定義になりうるため呼び出し側は必ず ?? null で扱うこと。
   */
  phase_started_at?: string | null
  /**
   * 終了操作時にサーバーが固定した経過秒数。status が finished 以外なら null。
   * バックエンドの段階的デプロイ中は未定義になりうる。
   */
  finished_elapsed_seconds?: number | null
  /**
   * 次に公開される問題の簡易プレビュー。無ければ null。
   * バックエンドPR未マージ時は未定義になりうるため呼び出し側は必ず ?? null で扱うこと。
   */
  next_question?: OperatorNextQuestion | null
}

/** Reset の成功レスポンスは通常の state に、必須の reset_operation を加える。 */
export interface OperatorQuizResetResponse extends OperatorQuizState {
  reset_operation: OperatorQuizResetOperation
}

export const PHASE_LABELS: Record<QuizPhase, string> = {
  IDLE: 'イベント開始前',
  PUBLISHED: '解答受付中',
  CLOSING: '10秒後に解答締め切り',
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
    case 'closing':
      return 'CLOSING'
    case 'closed':
      return 'CLOSED'
    case 'revealed':
      return 'REVEALED'
    default:
      return 'PUBLISHED'
  }
}

/** サーバーが実在すると判定した次問の位置。終了済み・最終問なら null。 */
export function getNextQuizPosition(state: OperatorQuizState): number | null {
  if (state.status !== 'in_progress' || state.current === null) return null
  return state.next_question?.position ?? null
}
