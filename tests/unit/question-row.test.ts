import { describe, expect, it } from 'vitest'
import {
  choiceText,
  correctChoiceText,
  formatCorrectBadge,
  formatQuestionPosition,
} from '../../app/features/problems/components/QuestionRow'
import type { Question } from '../../app/features/problems/types'

const question: Question = {
  id: 103,
  position: 3,
  questionText: '日本の首都はどこでしょう?',
  choiceA: '東京',
  choiceB: '大阪',
  choiceC: '札幌',
  choiceD: '福岡',
  correctAnswer: 'A',
  imageUrl: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
}

describe('QuestionRow表示ユーティリティ', () => {
  it('問題番号にはDB idではなくpositionを使用する', () => {
    expect(formatQuestionPosition(question.position)).toBe('Q3')
  })

  it('正解バッジを正解キーの形式にする', () => {
    expect(formatCorrectBadge(question)).toBe('正解 A')
  })

  it('正解選択肢と任意の選択肢をAPIレスポンスから取得する', () => {
    expect(correctChoiceText(question)).toBe('東京')
    expect(choiceText(question, 'D')).toBe('福岡')
  })
})
