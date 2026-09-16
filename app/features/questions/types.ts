export type ChoiceKey = 'A' | 'B' | 'C' | 'D'

export interface Question {
  id: number
  questionText: string
  choices: Record<ChoiceKey, string>
  correctAnswer: ChoiceKey | '' // 未選択を許容(型は広げておく)
}

export type QuestionFormState = Omit<Question, 'id'>

export interface QuestionFieldErrors {
  questionText: string
  choices: Record<ChoiceKey, string>
  correctAnswer: string
}
