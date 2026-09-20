import { beforeEach, describe, expect, it, vi } from 'vitest'

import { request } from '~/lib/api/client'
import {
  bulkDeleteQuestions,
  createQuestion,
  deleteQuestion,
  fetchConfidenceMultipliers,
  fetchQuestion,
  fetchQuestions,
  reorderQuestions,
  selectRelayQuestion,
  updateConfidenceMultiplier,
  updateQuestion,
} from '../../app/features/problems/api/client'
import type { Question } from '../../app/features/problems/types'

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

  it('一括削除はids付きのPOSTで送り、削除件数を返す', async () => {
    mockedRequest.mockResolvedValueOnce({ deletedCount: 2, deletedIds: [3, 5] })
    await expect(bulkDeleteQuestions([3, 5])).resolves.toEqual({ deletedCount: 2, deletedIds: [3, 5] })
    expect(mockedRequest).toHaveBeenCalledWith('/admin/questions/bulk_destroy', {
      method: 'POST',
      credentials: 'include',
      body: { ids: [3, 5] },
    })
  })

  it('並べ替えは全問題IDをPATCHで送る', async () => {
    mockedRequest.mockResolvedValueOnce([])

    await reorderQuestions([3, 1, 2])

    expect(mockedRequest).toHaveBeenCalledWith('/admin/questions/reorder', {
      method: 'PATCH',
      credentials: 'include',
      body: { questionIds: [3, 1, 2] },
    })
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

  it('制限時間(timeLimitSeconds)は snake_case の time_limit_seconds として送信し、未指定なら送らない', async () => {
    mockedRequest.mockResolvedValue(undefined)

    await createQuestion({ ...payload, timeLimitSeconds: 30 })
    expect(formDataEntries(mockedRequest.mock.calls[0]?.[1]?.body)).toMatchObject({ time_limit_seconds: '30' })

    await createQuestion({ ...payload, timeLimitSeconds: null })
    expect(formDataEntries(mockedRequest.mock.calls[1]?.[1]?.body)).toMatchObject({ time_limit_seconds: '' })

    await createQuestion(payload)
    expect(formDataEntries(mockedRequest.mock.calls[2]?.[1]?.body)).not.toHaveProperty('time_limit_seconds')
  })

  it('画像ファイルと削除フラグをFormDataに含める', async () => {
    mockedRequest.mockResolvedValue(undefined)
    const image = new File(['dummy'], 'question.png', { type: 'image/png' })

    await createQuestion({ ...payload, image })
    expect(formDataEntries(mockedRequest.mock.calls[0]?.[1]?.body)).toMatchObject({ image })

    await updateQuestion(12, { ...payload, removeImage: true })
    expect(formDataEntries(mockedRequest.mock.calls[1]?.[1]?.body)).toMatchObject({ removeImage: 'true' })
  })

  it('isSelectedRelayQuestionが指定された場合のみFormDataに含める', async () => {
    mockedRequest.mockResolvedValue(undefined)

    await createQuestion({ ...payload, isSelectedRelayQuestion: true })
    expect(formDataEntries(mockedRequest.mock.calls[0]?.[1]?.body)).toMatchObject({ isSelectedRelayQuestion: 'true' })

    await createQuestion({ ...payload, isSelectedRelayQuestion: false })
    expect(formDataEntries(mockedRequest.mock.calls[1]?.[1]?.body)).toMatchObject({ isSelectedRelayQuestion: 'false' })

    await createQuestion(payload)
    expect(formDataEntries(mockedRequest.mock.calls[2]?.[1]?.body)).not.toHaveProperty('isSelectedRelayQuestion')
  })

  it('selectRelayQuestionは一覧から読み込んだ問題の全項目を引き継ぎ、選択状態だけ更新するPUTを送る', async () => {
    mockedRequest.mockResolvedValue(undefined)
    const question: Question = {
      id: 12,
      position: 1,
      questionText: 'テスト問題',
      choiceA: 'A',
      choiceB: 'B',
      choiceC: 'C',
      choiceD: 'D',
      correctAnswer: 'A',
      imageUrl: null,
      explanation: null,
      targetAudience: null,
      isRelayQuestion: true,
      isSelectedRelayQuestion: false,
      points: 100,
      timeLimitSeconds: 30,
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    }

    await selectRelayQuestion(question, true)

    expect(mockedRequest.mock.calls[0]?.[0]).toBe('/admin/questions/12')
    expect(mockedRequest.mock.calls[0]?.[1]).toMatchObject({ method: 'PUT', credentials: 'include' })
    expect(formDataEntries(mockedRequest.mock.calls[0]?.[1]?.body)).toEqual({
      questionText: 'テスト問題',
      choiceA: 'A',
      choiceB: 'B',
      choiceC: 'C',
      choiceD: 'D',
      correctAnswer: 'A',
      explanation: '',
      targetAudience: '',
      isRelayQuestion: 'true',
      isSelectedRelayQuestion: 'true',
      points: '100',
      time_limit_seconds: '30',
    })
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
