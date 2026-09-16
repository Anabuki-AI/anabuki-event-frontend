import type { ConfidenceLevel, ConfidenceMultipliers, Question } from '../types'
import { request } from '~/lib/api/client'

const credentials = 'include' as const

/** POST / PUT に送る問題の入力値。画像登録は未対応のため含めない。 */
export interface QuestionPayload {
  questionText: string
  choiceA: string
  choiceB: string
  choiceC: string
  choiceD: string
  correctAnswer: Question['correctAnswer']
}

export function fetchQuestions(): Promise<Question[]> {
  return request<Question[]>('/admin/questions', { credentials })
}

export function fetchQuestion(id: number): Promise<Question> {
  return request<Question>(`/admin/questions/${id}`, { credentials })
}

export function createQuestion(payload: QuestionPayload): Promise<Question> {
  return request<Question>('/admin/questions', {
    method: 'POST',
    body: payload,
    credentials,
  })
}

export function updateQuestion(id: number, payload: QuestionPayload): Promise<Question> {
  return request<Question>(`/admin/questions/${id}`, {
    method: 'PUT',
    body: payload,
    credentials,
  })
}

export function deleteQuestion(id: number): Promise<undefined> {
  return request<undefined>(`/admin/questions/${id}`, {
    method: 'DELETE',
    credentials,
  })
}

export function fetchConfidenceMultipliers(): Promise<ConfidenceMultipliers> {
  return request<ConfidenceMultipliers>('/admin/confidence-multipliers', { credentials })
}

export function updateConfidenceMultiplier(level: ConfidenceLevel, confidenceMultiplier: number): Promise<ConfidenceMultipliers> {
  return request<ConfidenceMultipliers>(`/admin/confidence-multipliers/${level}`, {
    method: 'PATCH',
    body: { confidenceMultiplier },
    credentials,
  })
}
