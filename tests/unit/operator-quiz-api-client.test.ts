import { beforeEach, describe, expect, it, vi } from 'vitest'
import { request } from '~/lib/api/client'
import {
  closeAnswers,
  fetchQuizState,
  publishQuestion,
  revealAnswer,
  startQuiz,
} from '~/features/quiz-control/api/client'

vi.mock('~/lib/api/client', () => ({ request: vi.fn() }))

const mockedRequest = vi.mocked(request)
const state = { event: null, questions: [] }

describe('運営クイズ進行 API client', () => {
  beforeEach(() => mockedRequest.mockReset())

  it('manager Cookie付きで実APIの状態を取得する', async () => {
    mockedRequest.mockResolvedValueOnce(state)

    await expect(fetchQuizState()).resolves.toEqual(state)
    expect(mockedRequest).toHaveBeenCalledWith('/operator/quiz/state', {
      credentials: 'include',
      retry: 0,
    })
  })

  it.each([
    ['start', startQuiz, '/operator/quiz/start'],
    ['publish', publishQuestion, '/operator/quiz/publish'],
    ['close', closeAnswers, '/operator/quiz/close'],
    ['reveal', revealAnswer, '/operator/quiz/reveal'],
  ])('%sをCookie付きPOST・リトライなしで実行する', async (_name, action, path) => {
    mockedRequest.mockResolvedValueOnce(state)

    await expect(action()).resolves.toEqual(state)
    expect(mockedRequest).toHaveBeenCalledWith(path, {
      method: 'POST',
      credentials: 'include',
      retry: 0,
    })
  })
})
