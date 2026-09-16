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
  createdAt: string
  updatedAt: string
}

export interface QuestionFormState {
  questionText: string
  choices: Record<ChoiceKey, string>
  correctAnswer: ChoiceKey
}

export interface QuestionFieldErrors {
  questionText: string
  choices: Record<ChoiceKey, string>
  correctAnswer: string
}
