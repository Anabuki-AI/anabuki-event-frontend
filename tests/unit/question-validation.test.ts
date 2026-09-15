import { describe, expect, it } from 'vitest'
import type { QuestionFormState } from '../../app/features/questions/types'
import {
  hasQuestionChanged,
  validateCorrectAnswer,
  validateRequiredText,
} from '../../app/features/questions/validation'

describe('validateRequiredText', () => {
  it('空文字はラベル付きエラーメッセージを返す', () => {
    expect(validateRequiredText('', '問題文')).toBe('問題文を入力してください')
  })

  it('空白のみもエラーメッセージを返す', () => {
    expect(validateRequiredText('   ', '選択肢A')).toBe('選択肢Aを入力してください')
  })

  it('入力済みは正常', () => {
    expect(validateRequiredText('東京', '選択肢A')).toBe('')
  })
})

describe('validateCorrectAnswer', () => {
  it('未選択はエラーメッセージを返す', () => {
    expect(validateCorrectAnswer('')).toBe('正解を選択してください')
  })

  it('選択済みは正常', () => {
    expect(validateCorrectAnswer('A')).toBe('')
  })
})

const BASELINE: QuestionFormState = {
  questionText: '日本の首都はどこでしょう?',
  choices: { A: '東京', B: '大阪', C: '札幌', D: '福岡' },
  correctAnswer: 'A',
}

describe('hasQuestionChanged', () => {
  it('同一内容は変更なしと判定する', () => {
    expect(hasQuestionChanged({ ...BASELINE, choices: { ...BASELINE.choices } }, BASELINE)).toBe(false)
  })

  it('問題文の変更を検出する', () => {
    const form = { ...BASELINE, questionText: '変更後の問題文', choices: { ...BASELINE.choices } }
    expect(hasQuestionChanged(form, BASELINE)).toBe(true)
  })

  it('選択肢の変更を検出する', () => {
    const form = { ...BASELINE, choices: { A: '京都', B: '大阪', C: '札幌', D: '福岡' } }
    expect(hasQuestionChanged(form, BASELINE)).toBe(true)
  })

  it('正解の変更を検出する', () => {
    const form = { ...BASELINE, correctAnswer: 'B' as const, choices: { ...BASELINE.choices } }
    expect(hasQuestionChanged(form, BASELINE)).toBe(true)
  })
})
