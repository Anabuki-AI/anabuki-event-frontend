import { describe, expect, it } from 'vitest'
import {
  choiceText,
  correctChoiceText,
  formatCorrectBadge,
  formatQuestionPosition,
  formatTimeLimit,
  getQuestionTimeLimitSeconds,
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
  explanation: null,
  targetAudience: null,
  points: 100,
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

  it('制限時間はtimeLimitSecondsが未定義/nullなら「制限時間なし」を返す', () => {
    expect(getQuestionTimeLimitSeconds(question)).toBeNull()
    expect(formatTimeLimit(question)).toBe('制限時間なし')
    expect(getQuestionTimeLimitSeconds({ ...question, timeLimitSeconds: null })).toBeNull()
  })

  it('制限時間(timeLimitSeconds)が設定されていれば秒数を返す', () => {
    const withLimit = { ...question, timeLimitSeconds: 30 }
    expect(getQuestionTimeLimitSeconds(withLimit)).toBe(30)
    expect(formatTimeLimit(withLimit)).toBe('30秒')
  })

  it('バックエンドがsnake_caseのtime_limit_secondsで返してきても防御的に読み取る', () => {
    const snakeCaseResponse = { ...question, time_limit_seconds: 45 } as unknown as Question
    expect(getQuestionTimeLimitSeconds(snakeCaseResponse)).toBe(45)
    expect(formatTimeLimit(snakeCaseResponse)).toBe('45秒')
  })
})
