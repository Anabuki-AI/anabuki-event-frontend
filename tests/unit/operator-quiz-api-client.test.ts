import { beforeEach, describe, expect, it, vi } from 'vitest'
import { request } from '~/lib/api/client'
import {
  closeAnswers,
  fetchQuizState,
  finishQuiz,
  publishQuestion,
  revealAnswer,
  startQuiz,
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
    ['publish', () => publishQuestion(2), '/operator/quiz/publish', { position: 2 }],
    ['close', () => closeAnswers(), '/operator/quiz/close', undefined],
    ['reveal', () => revealAnswer(), '/operator/quiz/reveal', undefined],
    ['finish', () => finishQuiz(), '/operator/quiz/finish', undefined],
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
})
