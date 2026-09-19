import type { Question } from '../types'

/** Question numbers are event positions; database ids are deliberately not shown to operators. */
export function formatQuestionPosition(position: number): string {
  return `Q${position}`
}

export interface BulkDeleteImpact {
  /** 選択された問題数 */
  total: number
  /** 出題中(ライブ)の問題数 */
  live: number
  /** 正解公開済みの問題数 */
  revealed: number
  /** 参加者の回答・自信度記録がある問題数 */
  answered: number
  /** 上記のいずれかに該当する問題数(重複は1問と数える)。0なら通常の削除。 */
  affected: number
}

/** 一括削除の確認ダイアログ用に、選択中の問題のうち影響の大きいものを数える。 */
export function summarizeBulkDeleteImpact(questions: Question[]): BulkDeleteImpact {
  const live = questions.filter(question => question.isLiveQuestion === true)
  const revealed = questions.filter(question => !!question.revealedAt)
  const answered = questions.filter(question => question.hasParticipantData === true)
  const affected = questions.filter(question => question.isLiveQuestion === true || !!question.revealedAt || question.hasParticipantData === true)
  return { total: questions.length, live: live.length, revealed: revealed.length, answered: answered.length, affected: affected.length }
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
