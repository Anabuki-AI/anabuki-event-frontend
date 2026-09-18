import { beforeEach, describe, expect, it, vi } from 'vitest'
import { request } from '~/lib/api/client'
import {
  closeAnswers,
  closeAnswersImmediately,
  fetchQuizState,
  finishQuiz,
  publishQuestion,
  revealAnswer,
  resetQuiz,
  startQuiz,
  updateCorrectAnswer,
} from '~/features/quiz-control/api/client'

vi.mock('~/lib/api/client', () => ({ request: vi.fn() }))

const mockedRequest = vi.mocked(request)
const state = {
  status: 'waiting',
  phase: null,
  current: null,
  question_count: 10,
  total_participants: 60,
}
const resetResponse = {
  ...state,
  reset_operation: {
    operation_id: 'operation-1',
    started_at: '2026-09-30T00:00:00.000000Z',
    completed_at: '2026-09-30T00:00:00.025000Z',
    affected_rows: {
      participant_reactions: 0,
      participant_answers: 0,
      confidence_selections: 0,
      participant_sessions: 0,
      participants: 0,
      question_reveals: 0,
      quiz_sessions: 1,
    },
  },
}

describe('運営クイズ進行 API client', () => {
  beforeEach(() => mockedRequest.mockReset())

  it('オペレーターCookie付きで実APIの状態を取得する', async () => {
    mockedRequest.mockResolvedValueOnce(state)

    await expect(fetchQuizState()).resolves.toEqual(state)
    expect(mockedRequest).toHaveBeenCalledWith('/operator/quiz/state', {
      credentials: 'include',
      retry: 0,
    })
  })

  it.each([
    ['start', () => startQuiz(), '/operator/quiz/start', undefined],
    ['publish', () => publishQuestion(), '/operator/quiz/publish', undefined],
    ['close', () => closeAnswers(), '/operator/quiz/close', undefined],
    ['immediate close after timer expiry', () => closeAnswersImmediately(), '/operator/quiz/close', { immediate: true }],
    ['reveal', () => revealAnswer(), '/operator/quiz/reveal', undefined],
    ['finish', () => finishQuiz(), '/operator/quiz/finish', undefined],
    ['live relay correct answer', () => updateCorrectAnswer('C'), '/operator/quiz/correct-answer', { correct_answer: 'C' }],
    ['reset with server confirmation', () => resetQuiz('RESET'), '/operator/quiz/reset', { confirmation: 'RESET' }],
  ])('%sをCookie付きPOST・リトライなしで実行する', async (_name, action, path, body) => {
    mockedRequest.mockResolvedValueOnce(state)

    await expect(action()).resolves.toEqual(state)
    expect(mockedRequest).toHaveBeenCalledWith(path, {
      method: 'POST',
      body,
      credentials: 'include',
      retry: 0,
    })
  })

  it('reset returns the server-issued operation receipt without reshaping it', async () => {
    mockedRequest.mockResolvedValueOnce(resetResponse)

    await expect(resetQuiz('RESET')).resolves.toEqual(resetResponse)
    expect(mockedRequest).toHaveBeenCalledWith('/operator/quiz/reset', {
      method: 'POST',
      body: { confirmation: 'RESET' },
      credentials: 'include',
      retry: 0,
    })
  })
})
