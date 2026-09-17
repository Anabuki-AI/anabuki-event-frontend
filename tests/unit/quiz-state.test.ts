import { describe, expect, it } from 'vitest'
import { getCurrentQuizQuestion, getNextQuizQuestion, getQuizPhase } from '~/features/quiz-control/types'
import type { QuizState } from '~/features/quiz-control/types'

const event = {
  id: 1,
  status: 'ACTIVE' as const,
  startedAt: '2026-09-30T01:00:00Z',
  finishedAt: null,
  confidenceMultipliers: { high: '2.00', normal: '1.00', low: '0.50' },
}

const question = {
  id: 11,
  sourceQuestionId: 101,
  position: 1,
  status: 'PENDING' as const,
  questionText: '問題',
  choiceA: 'A',
  choiceB: 'B',
  choiceC: 'C',
  choiceD: 'D',
  correctAnswer: 'A' as const,
  imageUrl: null,
  basePoints: 100,
}

function state(overrides: Partial<QuizState> = {}): QuizState {
  return { event, questions: [question], ...overrides }
}

describe('運営クイズ状態の導出', () => {
  it('eventとquestionsから現在問・次問・操作フェーズを導出する', () => {
    const quizState = state({
      questions: [
        { ...question, status: 'REVEALED' },
        { ...question, id: 12, position: 2, status: 'PUBLISHED' },
        { ...question, id: 13, position: 3 },
      ],
    })

    expect(getQuizPhase(quizState)).toBe('PUBLISHED')
    expect(getCurrentQuizQuestion(quizState)?.id).toBe(12)
    expect(getNextQuizQuestion(quizState)?.id).toBe(13)
  })

  it('FINISHEDは最終問がREVEALEDでも終了フェーズを優先する', () => {
    const quizState = state({
      event: { ...event, status: 'FINISHED', finishedAt: '2026-09-30T02:00:00Z' },
      questions: [{ ...question, status: 'REVEALED' }],
    })

    expect(getQuizPhase(quizState)).toBe('FINISHED')
  })
})
