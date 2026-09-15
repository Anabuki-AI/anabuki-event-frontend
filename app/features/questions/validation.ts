import type { ChoiceKey, QuestionFormState } from './types'

export function validateRequiredText(value: string, label: string): string {
  return value.trim() === '' ? `${label}を入力してください` : ''
}

export function validateCorrectAnswer(value: ChoiceKey | ''): string {
  return value === '' ? '正解を選択してください' : ''
}

// キャンセルガード用。choicesはキー順固定のRecordなのでJSON比較で判定できる
export function hasQuestionChanged(form: QuestionFormState, baseline: QuestionFormState): boolean {
  return JSON.stringify(form) !== JSON.stringify(baseline)
}
