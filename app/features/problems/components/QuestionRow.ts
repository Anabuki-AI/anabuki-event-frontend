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

/**
 * 制限時間(秒)を取り出す。バックエンドの実装状況によっては timeLimitSeconds が
 * 未定義、もしくは(運営クイズAPIと同じ)snake_caseの time_limit_seconds で
 * 返ってくる可能性があるため、両対応で防御的に読み取る。
 */
export function getQuestionTimeLimitSeconds(question: Question): number | null {
  const camelCase = question.timeLimitSeconds
  if (typeof camelCase === 'number') return camelCase

  const snakeCase = (question as unknown as { time_limit_seconds?: number | null }).time_limit_seconds
  return typeof snakeCase === 'number' ? snakeCase : null
}

/** 制限時間を画面表示用に整形する。 */
export function formatTimeLimit(question: Question): string {
  const seconds = getQuestionTimeLimitSeconds(question)
  return seconds === null ? '制限時間なし' : `${seconds}秒`
}
