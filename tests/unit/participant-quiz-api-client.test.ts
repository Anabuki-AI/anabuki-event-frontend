import { beforeEach, describe, expect, it, vi } from 'vitest'
import { request } from '~/lib/api/client'
import {
  confirmParticipantQuizConfidence,
  fetchParticipantQuizState,
  submitParticipantQuizAnswer,
} from '~/features/participant-quiz/api/client'

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

  it('自信度をCookie付きPOSTで事前確定する', async () => {
    const input = { question_id: 12, confidence_level: 'low' as const }
    const state = { status: 'in_progress', phase: 'answering', question: null, answered: false, my_answer: null, correct_answer: null, confidence_level: 'low', confidence_locked: true }
    mockedRequest.mockResolvedValueOnce(state)

    await expect(confirmParticipantQuizConfidence(input)).resolves.toEqual(state)
    expect(mockedRequest).toHaveBeenCalledWith('/participant/quiz/confidence-level', {
      method: 'POST',
      body: input,
      credentials: 'include',
      retry: 0,
    })
  })

  it('確定済みレベルで解答だけをCookie付きPOSTする', async () => {
    const input = { question_id: 12, choice: 'B' as const }
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
