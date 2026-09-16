import type { Question } from '../types'

/** Question numbers are event positions; database ids are deliberately not shown to operators. */
export function formatQuestionPosition(position: number): string {
  return `Q${position}`
}

export function formatCorrectBadge(question: Question): string {
  return `正解 ${question.correctAnswer}`
}

export function correctChoiceText(question: Question): string {
  return question[`choice${question.correctAnswer}`]
}

export function choiceText(question: Question, key: Question['correctAnswer']): string {
  return question[`choice${key}`]
}
