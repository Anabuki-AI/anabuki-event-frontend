export type AnswerChoice = 'A' | 'B' | 'C' | 'D'
export type QuizSessionStatus = 'waiting' | 'in_progress' | 'finished'
export type QuizSessionPhase = 'answering' | 'closing' | 'closed' | 'revealed'

/** バックエンドの confidence_multipliers で使用する自信度キー。 */
export type ConfidenceLevel = 'high' | 'normal' | 'low'

export interface ParticipantQuizQuestion {
  question_id: number
  position: number
  question_text: string
  /** 常に4択すべて。Lv.1で除外された選択肢は eliminated_choice で示され、グレーアウト表示する。 */
  choices: Record<AnswerChoice, string>
  /** Lv.1（low）確定時にサーバーが選んだ不正解の選択肢。未確定/他レベルでは null。 */
  eliminated_choice: AnswerChoice | null
  /** 中継問題のライブ出題中は true。正解・不正解が未確定のためLv.1を選択できない。 */
  is_live_relay_question?: boolean
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
  /** 現在選択中の自信度。未選択なら null。 */
  confidence_level?: ConfidenceLevel | null
  /** Lv.1を選んだ後、または解答受付後に true になり、レベル変更はできなくなる。 */
  confidence_locked?: boolean
}

export interface ConfirmParticipantQuizConfidenceInput {
  question_id: number
  confidence_level: ConfidenceLevel
  /** 現在押している選択肢。Lv.1確定時にその選択肢を除外対象から外すために使う。 */
  choice?: AnswerChoice
}

export interface SubmitParticipantQuizAnswerInput {
  question_id: number
  choice: AnswerChoice
  /** 解答後の再送時のみ。「普通」「あり」間の変更に使う(「なし」は変更不可)。 */
  confidence_level?: ConfidenceLevel
}

/** POST /api/participant/quiz/answers のレスポンス(初回受付・再送後の my_answer)。 */
export interface SubmitParticipantQuizAnswerResult {
  my_answer: ParticipantQuizMyAnswer
}

export const CONFIDENCE_LEVEL_LABELS: Record<ConfidenceLevel, string> = {
  low: 'なし',
  normal: '普通',
  high: 'あり',
}
