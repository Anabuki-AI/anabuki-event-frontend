export type ChoiceKey = 'A' | 'B' | 'C' | 'D'

/** 自信度の3段階。回答時にどれを選んだかで正解時の配点倍率が変わる */
export type ConfidenceLevel = 'high' | 'normal' | 'low'

/** 3段階それぞれの自信度倍率(文字列。表示時に整形する) */
export type ConfidenceMultipliers = Record<ConfidenceLevel, string>

export interface Question {
  id: number
  questionText: string
  choices: Record<ChoiceKey, string>
  correctAnswer: ChoiceKey
  /** 問題画像のURL。未設定の場合は画像なし(一覧では画像枠自体を表示しない) */
  imageUrl?: string
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
