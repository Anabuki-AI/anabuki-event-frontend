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
