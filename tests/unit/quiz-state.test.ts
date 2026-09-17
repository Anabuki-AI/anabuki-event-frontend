import { describe, expect, it } from 'vitest'
import { getNextQuizPosition, getQuizPhase } from '~/features/quiz-control/types'
import type { OperatorQuizState } from '~/features/quiz-control/types'

const currentQuestion = {
  question_id: 12,
  position: 2,
  question_text: '問題',
  choices: { A: 'a', B: 'b', C: 'c', D: 'd' },
  image_url: null,
  correct_answer: 'B' as const,
  answered_count: 37,
  answered_rate: 0.62,
}

function state(overrides: Partial<OperatorQuizState> = {}): OperatorQuizState {
  return {
    status: 'in_progress',
    phase: 'answering',
    current: currentQuestion,
    question_count: 10,
    total_participants: 60,
    ...overrides,
  }
}

describe('運営クイズ状態の導出', () => {
  it('status/phaseから画面フェーズを導出する', () => {
    expect(getQuizPhase(state({ status: 'waiting', phase: null, current: null }))).toBe('IDLE')
    expect(getQuizPhase(state({ phase: 'answering' }))).toBe('PUBLISHED')
    expect(getQuizPhase(state({ phase: 'closed' }))).toBe('CLOSED')
    expect(getQuizPhase(state({ phase: 'revealed' }))).toBe('REVEALED')
    expect(getQuizPhase(state({ status: 'finished', phase: null, current: null }))).toBe('FINISHED')
  })

  it('次問の位置は現在問+1で、最終問や未開始では取得できない', () => {
    expect(getNextQuizPosition(state())).toBe(3)
    expect(getNextQuizPosition(state({ current: { ...currentQuestion, position: 10 } }))).toBeNull()
    expect(getNextQuizPosition(state({ status: 'waiting', current: null }))).toBeNull()
  })
})
