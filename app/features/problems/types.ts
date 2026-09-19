export type ChoiceKey = 'A' | 'B' | 'C' | 'D'

/** 回答時に選択する自信度の3段階 */
export type ConfidenceLevel = 'high' | 'normal' | 'low'

/** バックエンドが返す、自信度段階ごとの配点倍率 */
export type ConfidenceMultipliers = Record<ConfidenceLevel, string>

/**
 * GET /api/admin/questions と POST/PUT のレスポンス。
 * API のプロパティ名をそのまま保持し、画面専用の変換モデルを持たない。
 */
export interface Question {
  id: number
  position: number
  questionText: string
  choiceA: string
  choiceB: string
  choiceC: string
  choiceD: string
  correctAnswer: ChoiceKey
  imageUrl: string | null
  /** 解説。正解表示後にのみ画面に表示する。 */
  explanation: string | null
  /** 出題対象。出題画面に問題文と併せて表示する。 */
  targetAudience: string | null
  isRelayQuestion?: boolean
  /**
   * 中継問題のうち、今回の出題として運営者が選択した1問かどうか。
   * true になれるのは isRelayQuestion が true の問題のみで、全問題中で
   * 同時に true になれるのは最大1問(バックエンドが保証)。
   * 中継問題でこれが false かつ revealedAt が未設定の間は correctAnswer を変更できない。
   */
  isSelectedRelayQuestion?: boolean
  /**
   * 現在ライブ進行画面(出題管理)の quiz_sessions.current_question として
   * 出題中かどうか(quizが in_progress かつ このIDが current_question_id と一致)。
   * isSelectedRelayQuestion(「今回の出題」として運営者が選択したか)とは無関係の
   * 別状態: 選択されていても実際にライブへ進むまでは false のままだし、逆に
   * 正解を公開した直後、次の問題へ進むまではこれが true のまま残る。
   * true の間はバックエンド(Question#protect_live_question)が correctAnswer を
   * 含む LIVE_FIELDS の変更を拒否する。
   */
  isLiveQuestion?: boolean
  /**
   * ライブ進行画面で運営者がこの問題の正解を公開した日時(ISO8601)。未公開なら null。
   * 一度設定されると、クイズ全体をリセットするまで消えない
   * (= 中継問題としての出番が終わったかどうかの判定に使える)。
   * 出番が終わった中継問題は、その後 isSelectedRelayQuestion が false に
   * 戻っていても correctAnswer を変更できる。
   */
  revealedAt?: string | null
  /**
   * この問題に参加者の回答または自信度選択が1件でも記録されているか。
   * 一括削除の確認ダイアログで「回答記録も消える」警告の対象数を数えるために使う。
   */
  hasParticipantData?: boolean
  /** 配点。この問題に正解した場合の基礎得点（自信度倍率を掛ける前の値）。 */
  points: number
  /**
   * 制限時間(秒)。null なら制限時間なし。
   * バックエンドPR未マージ時は未定義になりうるため呼び出し側は必ず ?? null で扱うこと。
   */
  timeLimitSeconds?: number | null
  createdAt: string
  updatedAt: string
}
