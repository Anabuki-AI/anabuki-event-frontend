import { beforeEach, describe, expect, it, vi } from 'vitest'
import { request } from '~/lib/api/client'
import { fetchParticipantQuizState, submitParticipantQuizAnswer } from '~/features/participant-quiz/api/client'

vi.mock('~/lib/api/client', () => ({ request: vi.fn() }))

const mockedRequest = vi.mocked(request)

describe('参加者クイズ API client', () => {
  beforeEach(() => mockedRequest.mockReset())

  it('状態をCookie付き・リトライなしで取得する', async () => {
    const state = { status: 'waiting', phase: null, question: null, answered: false, my_answer: null, correct_answer: null }
    mockedRequest.mockResolvedValueOnce(state)

    await expect(fetchParticipantQuizState()).resolves.toEqual(state)
    expect(mockedRequest).toHaveBeenCalledWith('/participant/quiz/state', {
      credentials: 'include',
      retry: 0,
    })
  })

  it('解答をCookie付きPOSTで送り、更新後のmy_answerを受け取る', async () => {
    const input = { question_id: 12, choice: 'B' as const, confidence_level: 'normal' as const }
    const result = { my_answer: { choice: 'B' as const, confidence_level: 'normal' as const } }
    mockedRequest.mockResolvedValueOnce(result)

    await expect(submitParticipantQuizAnswer(input)).resolves.toEqual(result)
    expect(mockedRequest).toHaveBeenCalledWith('/participant/quiz/answers', {
      method: 'POST',
      body: input,
      credentials: 'include',
      retry: 0,
    })
  })
})
