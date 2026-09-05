import type { QuestionFieldErrors, QuestionFormState } from './types'
import { CHOICE_KEYS } from './constants'

export function validateQuestionText(value: string): string {
  return value.trim() === '' ? '問題文を入力してください' : ''
}

export function validateChoice(value: string): string {
  return value.trim() === '' ? '選択肢を入力してください' : ''
}

export function validateCorrectAnswer(value: string): string {
  return value === '' ? '正解を選択してください' : ''
}

export function validateQuestionForm(form: QuestionFormState): QuestionFieldErrors {
  const choiceErrors = {} as Record<import('./types').ChoiceKey, string>
  for (const key of CHOICE_KEYS) {
    choiceErrors[key] = validateChoice(form.choices[key])
  }
  return {
    questionText: validateQuestionText(form.questionText),
    choices: choiceErrors,
    correctAnswer: validateCorrectAnswer(form.correctAnswer),
  }
}

export function hasFieldErrors(errors: QuestionFieldErrors): boolean {
  if (errors.questionText !== '' || errors.correctAnswer !== '') {
    return true
  }
  return CHOICE_KEYS.some(key => errors.choices[key] !== '')
}

// キャンセルガード用。choicesはキー順固定のRecordなのでJSON比較で判定できる
export function hasQuestionChanged(form: QuestionFormState, baseline: QuestionFormState): boolean {
  return JSON.stringify(form) !== JSON.stringify(baseline)
}

/** 自信度倍率の入力値チェック。空でない数値で min〜max 内 */
export function validateMultiplierInput(value: string, min: number, max: number): string {
  if (value.trim() === '') {
    return '自信度倍率を入力してください'
  }
  const numeric = Number(value)
  if (Number.isNaN(numeric)) {
    return '数値で入力してください'
  }
  if (numeric < min || numeric > max) {
    return `${min}〜${max}の範囲で入力してください`
  }
  const decimals = value.split('.')[1]
  if (decimals != null && decimals.length > 2) {
    return '小数点以下は2桁までで入力してください'
  }
  return ''
}
