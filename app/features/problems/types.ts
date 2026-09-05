export type ChoiceKey = 'A' | 'B' | 'C' | 'D'

export interface Question {
  id: number
  questionText: string
  choices: Record<ChoiceKey, string>
  correctAnswer: ChoiceKey
  /** 自信度倍率。文字列で受け取り表示時に整形する（例: "1.00"） */
  confidenceMultiplier: string
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
