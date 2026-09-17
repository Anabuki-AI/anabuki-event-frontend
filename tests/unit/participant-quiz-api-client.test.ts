import { beforeEach, describe, expect, it, vi } from 'vitest'
import { request } from '~/lib/api/client'
import { fetchParticipantQuizState, submitParticipantQuizAnswer } from '~/features/participant-quiz/api/client'

vi.mock('~/lib/api/client', () => ({ request: vi.fn() }))

const mockedRequest = vi.mocked(request)

describe('参加者クイズ API client', () => {
  beforeEach(() => mockedRequest.mockReset())

  it('状態をCookie付き・リトライなしで取得する', async () => {
    const state = { event: null, question: null }
    mockedRequest.mockResolvedValueOnce(state)

    await expect(fetchParticipantQuizState()).resolves.toEqual(state)
    expect(mockedRequest).toHaveBeenCalledWith('/participant/quiz/state', {
      credentials: 'include',
      retry: 0,
    })
  })

  it('解答をCookie付きPOSTで一度だけ送る', async () => {
    const input = { quizEventQuestionId: 31, answer: 'B' as const, confidenceLevel: 'high' as const }
    mockedRequest.mockResolvedValueOnce({ id: 91, ...input, submittedAt: '2026-09-30T01:01:00Z' })

    await submitParticipantQuizAnswer(input)

    expect(mockedRequest).toHaveBeenCalledWith('/participant/quiz/answers', {
      method: 'POST',
      body: input,
      credentials: 'include',
      retry: 0,
    })
  })
})
