import { formatMultiplier } from '../constants'
import type { Question } from '../types'

/**
 * 問題一覧の1行表示ユーティリティ(旧QuestionRow.vueのscript)。
 * 行のテンプレートはpages/event_operator/problem-management.vueに統合済み
 * (summary=1行の問題文、details折り畳み内に選択肢・倍率・操作)。
 */
export function formatQuestionId(id: number): string {
  return `Q${id}`
}

export function formatCorrectBadge(question: Question): string {
  return `正解 ${question.correctAnswer}`
}

export function correctChoiceText(question: Question): string {
  return question.choices[question.correctAnswer]
}

export function formatMultiplierChip(question: Question): string {
  return `自信度倍率 ×${formatMultiplier(question.confidenceMultiplier)}`
}
