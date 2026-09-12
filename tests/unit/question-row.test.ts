import { describe, expect, it } from 'vitest'
import {
  correctChoiceText,
  formatCorrectBadge,
  formatMultiplierChip,
  formatQuestionId,
} from '../../app/features/problems/components/QuestionRow'
import type { Question } from '../../app/features/problems/types'

const question: Question = {
  id: 3,
  questionText: '日本の首都はどこでしょう?',
  choices: { A: '東京', B: '大阪', C: '札幌', D: '福岡' },
  correctAnswer: 'A',
  confidenceMultiplier: '1.50',
}

describe('QuestionRow表示ユーティリティ', () => {
  it('問題番号をQ+番号の形式にする', () => {
    expect(formatQuestionId(3)).toBe('Q3')
  })

  it('正解バッジを正解キーの形式にする', () => {
    expect(formatCorrectBadge(question)).toBe('正解 A')
  })

  it('正解バッジのtitle用に正解選択肢の全文を返す', () => {
    expect(correctChoiceText(question)).toBe('東京')
  })

  it('自信度倍率を×+小数2桁の形式にする', () => {
    expect(formatMultiplierChip(question)).toBe('自信度倍率 ×1.50')
  })
})
