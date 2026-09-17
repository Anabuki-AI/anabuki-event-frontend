import { describe, expect, it } from 'vitest'
import {
  getParticipantQuizScreen,
  isParticipantQuizFinishedState,
  isParticipantQuizWaitingState,
} from '~/features/participant-quiz/composables/use-participant-quiz-answer'
import type { ParticipantQuizState } from '~/features/participant-quiz/types'

const event = {
  id: 12,
  status: 'ACTIVE' as const,
  startedAt: '2026-09-30T01:00:00Z',
  finishedAt: null,
  totalQuestions: 10,
  revealedQuestionCount: 0,
  confidenceMultipliers: { high: '2.00', normal: '1.00', low: '0.50' },
}

const question = {
  id: 31,
  position: 1,
  status: 'PUBLISHED' as const,
  questionText: '問題文',
  choiceA: '選択肢A',
  choiceB: '選択肢B',
  choiceC: '選択肢C',
  choiceD: '選択肢D',
  imageUrl: null,
}

describe('参加者クイズの画面遷移状態', () => {
  it('未開始・次問待機・PENDINGは待機画面へ戻す', () => {
    expect(isParticipantQuizWaitingState({ event: null, question: null })).toBe(true)
    expect(isParticipantQuizWaitingState({ event, question: null })).toBe(true)
    expect(isParticipantQuizWaitingState({ event, question: { ...question, status: 'PENDING' } })).toBe(true)
  })

  it('公開・締切・正答発表中の問題は解答画面で扱う', () => {
    const states: ParticipantQuizState[] = ['PUBLISHED', 'CLOSED', 'REVEALED'].map(status => ({
      event,
      question: { ...question, status: status as typeof question.status },
    }))

    states.forEach(state => expect(isParticipantQuizWaitingState(state)).toBe(false))
  })

  it('FINISHEDは最終問がREVEALEDでも待機画面への遷移対象にしない', () => {
    const finished: ParticipantQuizState = {
      event: { ...event, status: 'FINISHED', finishedAt: '2026-09-30T02:00:00Z' },
      question: { ...question, status: 'REVEALED' },
    }

    expect(isParticipantQuizFinishedState(finished)).toBe(true)
    expect(isParticipantQuizWaitingState(finished)).toBe(false)
    expect(getParticipantQuizScreen(finished, false)).toBe('finished')
  })
})
