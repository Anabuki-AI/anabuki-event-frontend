import type { ApiFieldErrors } from '~/lib/api/error'
import type { ChoiceKey, QuestionFieldErrors, QuestionFormState } from './types'
import { CHOICE_KEYS } from './constants'

export function emptyQuestionFieldErrors(): QuestionFieldErrors {
  return {
    questionText: '',
    choices: { A: '', B: '', C: '', D: '' },
    correctAnswer: '',
  }
}

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
  const choiceErrors = {} as Record<ChoiceKey, string>
  for (const key of CHOICE_KEYS) {
    choiceErrors[key] = validateChoice(form.choices[key])
  }
  return {
    questionText: validateQuestionText(form.questionText),
    choices: choiceErrors,
    correctAnswer: validateCorrectAnswer(form.correctAnswer),
  }
}

/** Maps the backend's flat choiceA–D errors to the fields used by the form. */
export function mapQuestionFieldErrors(fieldErrors?: ApiFieldErrors): QuestionFieldErrors {
  const errors = emptyQuestionFieldErrors()
  if (fieldErrors == null) return errors

  const first = (key: string) => {
    const messages = fieldErrors[key]
    return typeof messages === 'string' ? messages : messages?.[0] ?? ''
  }
  errors.questionText = first('questionText')
  errors.correctAnswer = first('correctAnswer')
  for (const key of CHOICE_KEYS) {
    errors.choices[key] = first(`choice${key}`) || first(`choices.${key}`)
  }
  return errors
}

export function hasFieldErrors(errors: QuestionFieldErrors): boolean {
  if (errors.questionText !== '' || errors.correctAnswer !== '') {
    return true
  }
  return CHOICE_KEYS.some(key => errors.choices[key] !== '')
}

export function hasQuestionChanged(form: QuestionFormState, baseline: QuestionFormState): boolean {
  return JSON.stringify(form) !== JSON.stringify(baseline)
}

/** Accept only canonical positive integer route ids (no zero, decimals, signs, or spaces). */
export function parseQuestionId(value: unknown): number | null {
  if (typeof value !== 'string' || !/^[1-9]\d*$/.test(value)) return null
  const id = Number(value)
  return Number.isSafeInteger(id) ? id : null
}

export function problemErrorMessage(statusCode: number | undefined, fallback: string): string {
  if (statusCode === 401) return 'ログインの有効期限が切れました。管理者として再度ログインしてください。'
  if (statusCode === 403) return '問題管理を行う権限がありません。管理者へお問い合わせください。'
  if (statusCode === 404) return '指定された問題は見つかりませんでした。'
  if (statusCode === 422) return '入力内容を確認してください。'
  return fallback
}

export function validateMultiplierInput(value: string | number, min: number, max: number): string {
  const text = String(value)
  if (text.trim() === '') return '自信度倍率を入力してください'
  const numeric = Number(text)
  if (!Number.isFinite(numeric)) return '数値で入力してください'
  if (numeric < min || numeric > max) return `${min}〜${max}の範囲で入力してください`
  const decimals = text.split('.')[1]
  if (decimals != null && decimals.length > 2) return '小数点以下は2桁までで入力してください'
  return ''
}
