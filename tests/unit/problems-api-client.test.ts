import { beforeEach, describe, expect, it, vi } from 'vitest'

import { request } from '~/lib/api/client'
import {
  createQuestion,
  deleteQuestion,
  fetchConfidenceMultipliers,
  fetchQuestion,
  fetchQuestions,
  updateConfidenceMultiplier,
  updateQuestion,
} from '../../app/features/problems/api/client'

vi.mock('~/lib/api/client', () => ({ request: vi.fn() }))

const mockedRequest = vi.mocked(request)
const payload = {
  questionText: 'テスト問題',
  choiceA: 'A',
  choiceB: 'B',
  choiceC: 'C',
  choiceD: 'D',
  correctAnswer: 'A' as const,
  explanation: '解説テキスト',
  targetAudience: '初級者向け',
  points: 100,
}

function formDataEntries(formData: unknown): Record<string, unknown> {
  return Object.fromEntries((formData as FormData).entries())
}

describe('問題管理API client', () => {
  beforeEach(() => mockedRequest.mockReset())

  it('問題の一覧・詳細をCookie付きGETで取得する', async () => {
    mockedRequest.mockResolvedValueOnce([]).mockResolvedValueOnce({})
    await fetchQuestions()
    await fetchQuestion(12)
    expect(mockedRequest).toHaveBeenNthCalledWith(1, '/admin/questions', { credentials: 'include' })
    expect(mockedRequest).toHaveBeenNthCalledWith(2, '/admin/questions/12', { credentials: 'include' })
  })

  it('作成・更新・削除にバックエンド契約のHTTP methodとCookieを指定する', async () => {
    mockedRequest.mockResolvedValue(undefined)
    await createQuestion(payload)
    await updateQuestion(12, payload)
    await deleteQuestion(12)

    const expectedFields = {
      questionText: 'テスト問題',
      choiceA: 'A',
      choiceB: 'B',
      choiceC: 'C',
      choiceD: 'D',
      correctAnswer: 'A',
      explanation: '解説テキスト',
      targetAudience: '初級者向け',
      points: '100',
    }

    expect(mockedRequest.mock.calls[0]?.[0]).toBe('/admin/questions')
    expect(mockedRequest.mock.calls[0]?.[1]).toMatchObject({ method: 'POST', credentials: 'include' })
    expect(formDataEntries(mockedRequest.mock.calls[0]?.[1]?.body)).toEqual(expectedFields)

    expect(mockedRequest.mock.calls[1]?.[0]).toBe('/admin/questions/12')
    expect(mockedRequest.mock.calls[1]?.[1]).toMatchObject({ method: 'PUT', credentials: 'include' })
    expect(formDataEntries(mockedRequest.mock.calls[1]?.[1]?.body)).toEqual(expectedFields)

    expect(mockedRequest).toHaveBeenNthCalledWith(3, '/admin/questions/12', { method: 'DELETE', credentials: 'include' })
  })

  it('画像ファイルと削除フラグをFormDataに含める', async () => {
    mockedRequest.mockResolvedValue(undefined)
    const image = new File(['dummy'], 'question.png', { type: 'image/png' })

    await createQuestion({ ...payload, image })
    expect(formDataEntries(mockedRequest.mock.calls[0]?.[1]?.body)).toMatchObject({ image })

    await updateQuestion(12, { ...payload, removeImage: true })
    expect(formDataEntries(mockedRequest.mock.calls[1]?.[1]?.body)).toMatchObject({ removeImage: 'true' })
  })

  it('倍率取得・更新にはGET/PATCHを使い、実レスポンスの文字列倍率を返す', async () => {
    const response = { high: '2.00', normal: '1.00', low: '0.50' }
    mockedRequest.mockResolvedValue(response)

    await expect(fetchConfidenceMultipliers()).resolves.toEqual(response)
    await expect(updateConfidenceMultiplier('high', 1.5)).resolves.toEqual(response)

    expect(mockedRequest).toHaveBeenNthCalledWith(1, '/admin/confidence-multipliers', { credentials: 'include' })
    expect(mockedRequest).toHaveBeenNthCalledWith(2, '/admin/confidence-multipliers/high', {
      method: 'PATCH', body: { confidenceMultiplier: 1.5 }, credentials: 'include',
    })
  })
})
