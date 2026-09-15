import { describe, expect, it } from 'vitest'
import {
  createMockQuestion,
  fetchMockConfidenceMultipliers,
  fetchMockQuestion,
  fetchMockQuestions,
  updateMockConfidenceMultiplier,
  updateMockQuestion,
} from '../../app/features/problems/mock'
import { ApiError } from '../../app/lib/api/error'
import type { QuestionPayload } from '../../app/features/problems/api/client'

const payload: QuestionPayload = {
  questionText: 'テスト用の問題文です',
  choices: { A: 'あ', B: 'い', C: 'う', D: 'え' },
  correctAnswer: 'C',
}

describe('モック問題API', () => {
  it('一覧は5問の仮データを返す（複製であり元配列ではない）', async () => {
    const questions = await fetchMockQuestions()

    expect(questions).toHaveLength(5)
    expect(questions[0].id).toBe(1)
    expect(questions).not.toBe(await fetchMockQuestions())
  })

  it('ID指定で1問取得できる', async () => {
    const question = await fetchMockQuestion(2)

    expect(question.id).toBe(2)
    expect(question.questionText).toContain('政令指定都市')
  })

  it('存在しないIDは404のApiErrorになる', async () => {
    const error = await fetchMockQuestion(999).catch((caught: unknown) => caught)

    expect(error).toBeInstanceOf(ApiError)
    expect((error as ApiError).statusCode).toBe(404)
  })

  it('取得した問題オブジェクトを書き換えても仮データ本体は変わらない', async () => {
    const question = await fetchMockQuestion(1)
    question.questionText = '書き換えた'

    const reloaded = await fetchMockQuestion(1)
    expect(reloaded.questionText).not.toBe('書き換えた')
  })

  it('追加すると採番IDで登録される', async () => {
    const before = await fetchMockQuestions()
    const created = await createMockQuestion(payload)

    expect(created.id).toBe(before.length + 1)
    expect(created.choices.C).toBe('う')
    expect(await fetchMockQuestions()).toHaveLength(before.length + 1)
  })

  it('編集は問題内容のみ更新する', async () => {
    const updated = await updateMockQuestion(4, payload)

    expect(updated.questionText).toBe('テスト用の問題文です')
    expect(updated.choices.C).toBe('う')
  })
})

describe('モック自信度倍率API（自信度あり/普通/なし3段階の共通設定値）', () => {
  it('既定値は高:2.00・普通:1.00・低:0.50', async () => {
    const current = await fetchMockConfidenceMultipliers()

    expect(current).toEqual({ high: '2.00', normal: '1.00', low: '0.50' })
  })

  it('1段階だけ変更しても他の段階には影響しない', async () => {
    const updated = await updateMockConfidenceMultiplier('high', '3')

    expect(updated).toEqual({ high: '3.00', normal: '1.00', low: '0.50' })
    expect(await fetchMockConfidenceMultipliers()).toEqual({ high: '3.00', normal: '1.00', low: '0.50' })
  })
})
