import { describe, expect, it } from 'vitest'
import { problemErrorMessage, validateMultiplierInput } from '../../app/features/problems/validation'
import { formatMultiplier } from '../../app/features/problems/constants'
import type { QuestionFormState as LegacyQuestionFormState } from '../../app/features/questions/types'
import {
  hasQuestionChanged as hasLegacyQuestionChanged,
  validateCorrectAnswer,
  validateRequiredText,
} from '../../app/features/questions/validation'

describe('problemErrorMessage', () => {
  it('案内を管理者だけでなくオペレーターにも対応させる', () => {
    expect(problemErrorMessage(401, 'fallback')).toBe('ログインの有効期限が切れました。オペレーターまたは管理者として再度ログインしてください。')
    expect(problemErrorMessage(403, 'fallback')).toBe('問題管理を行う権限がありません。オペレーター権限または管理者権限について、運営担当者へお問い合わせください。')
  })
})

describe('validateMultiplierInput', () => {
  it('空入力はエラー', () => {
    expect(validateMultiplierInput('', 0, 9.99)).toBe('自信度倍率を入力してください')
  })

  it('数値以外はエラー', () => {
    expect(validateMultiplierInput('abc', 0, 9.99)).toBe('数値で入力してください')
  })

  it('範囲外はエラー', () => {
    expect(validateMultiplierInput('-0.1', 0, 9.99)).toContain('範囲')
    expect(validateMultiplierInput('10', 0, 9.99)).toContain('範囲')
  })

  it('小数3桁はエラー', () => {
    expect(validateMultiplierInput('1.234', 0, 9.99)).toContain('2桁')
  })

  it('境界値と小数2桁は OK', () => {
    expect(validateMultiplierInput('0', 0, 9.99)).toBe('')
    expect(validateMultiplierInput('9.99', 0, 9.99)).toBe('')
    expect(validateMultiplierInput('1.5', 0, 9.99)).toBe('')
  })
})

describe('formatMultiplier', () => {
  it('小数2桁に整形する', () => {
    expect(formatMultiplier('1')).toBe('1.00')
    expect(formatMultiplier('1.5')).toBe('1.50')
    expect(formatMultiplier(2)).toBe('2.00')
  })

  it('不正値はそのまま返す', () => {
    expect(formatMultiplier('abc')).toBe('abc')
  })
})

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

const BASELINE: LegacyQuestionFormState = {
  questionText: '日本の首都はどこでしょう?',
  choices: { A: '東京', B: '大阪', C: '札幌', D: '福岡' },
  correctAnswer: 'A',
}

describe('legacy hasQuestionChanged', () => {
  it('同一内容は変更なしと判定する', () => {
    expect(hasLegacyQuestionChanged({ ...BASELINE, choices: { ...BASELINE.choices } }, BASELINE)).toBe(false)
  })

  it('問題文の変更を検出する', () => {
    const form = { ...BASELINE, questionText: '変更後の問題文', choices: { ...BASELINE.choices } }
    expect(hasLegacyQuestionChanged(form, BASELINE)).toBe(true)
  })

  it('選択肢の変更を検出する', () => {
    const form = { ...BASELINE, choices: { A: '京都', B: '大阪', C: '札幌', D: '福岡' } }
    expect(hasLegacyQuestionChanged(form, BASELINE)).toBe(true)
  })

  it('正解の変更を検出する', () => {
    const form = { ...BASELINE, correctAnswer: 'B' as const, choices: { ...BASELINE.choices } }
    expect(hasLegacyQuestionChanged(form, BASELINE)).toBe(true)
  })
})
