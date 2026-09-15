import type { ChoiceKey, ConfidenceLevel, ConfidenceMultipliers, Question } from '../types'
import { request } from '~/lib/api/client'
import {
  createMockQuestion,
  fetchMockConfidenceMultipliers,
  fetchMockQuestion,
  fetchMockQuestions,
  updateMockConfidenceMultiplier,
  updateMockQuestion,
} from '../mock'

/**
 * バックエンドAPI(/api/admin/questions)未結合でも画面を確認できるよう
 * 仮データを返すフラグ。実API結合時に false にする。
 */
const USE_MOCK = true

interface QuestionApiModel {
  id: number
  questionText: string
  choiceA: string
  choiceB: string
  choiceC: string
  choiceD: string
  correctAnswer: ChoiceKey
  imageUrl?: string
}

function toQuestion(model: QuestionApiModel): Question {
  return {
    id: model.id,
    questionText: model.questionText,
    choices: {
      A: model.choiceA,
      B: model.choiceB,
      C: model.choiceC,
      D: model.choiceD,
    },
    correctAnswer: model.correctAnswer,
    imageUrl: model.imageUrl,
  }
}

export interface QuestionPayload {
  questionText: string
  choices: Record<ChoiceKey, string>
  correctAnswer: ChoiceKey
}

function toApiModel(payload: QuestionPayload) {
  return {
    questionText: payload.questionText,
    choiceA: payload.choices.A,
    choiceB: payload.choices.B,
    choiceC: payload.choices.C,
    choiceD: payload.choices.D,
    correctAnswer: payload.correctAnswer,
  }
}

export async function fetchQuestions(): Promise<Question[]> {
  if (USE_MOCK) {
    return fetchMockQuestions()
  }
  const models = await request<QuestionApiModel[]>('/admin/questions')
  return models.map(toQuestion)
}

export async function fetchQuestion(id: number): Promise<Question> {
  if (USE_MOCK) {
    return fetchMockQuestion(id)
  }
  const model = await request<QuestionApiModel>(`/admin/questions/${id}`)
  return toQuestion(model)
}

export async function createQuestion(payload: QuestionPayload): Promise<Question> {
  if (USE_MOCK) {
    return createMockQuestion(payload)
  }
  const model = await request<QuestionApiModel>('/admin/questions', {
    method: 'POST',
    body: toApiModel(payload),
  })
  return toQuestion(model)
}

export async function updateQuestion(id: number, payload: QuestionPayload): Promise<Question> {
  if (USE_MOCK) {
    return updateMockQuestion(id, payload)
  }
  const model = await request<QuestionApiModel>(`/admin/questions/${id}`, {
    method: 'PUT',
    body: toApiModel(payload),
  })
  return toQuestion(model)
}

/** 自信度倍率は問題ごとではなく、「自信度あり/普通/なし」3段階に共通で適用される設定値 */
export async function fetchConfidenceMultipliers(): Promise<ConfidenceMultipliers> {
  if (USE_MOCK) {
    return fetchMockConfidenceMultipliers()
  }
  return request<ConfidenceMultipliers>('/admin/confidence-multipliers')
}

export async function updateConfidenceMultiplier(level: ConfidenceLevel, value: string): Promise<ConfidenceMultipliers> {
  if (USE_MOCK) {
    return updateMockConfidenceMultiplier(level, value)
  }
  return request<ConfidenceMultipliers>(`/admin/confidence-multipliers/${level}`, {
    method: 'PATCH',
    body: { confidenceMultiplier: Number(value) },
  })
}
