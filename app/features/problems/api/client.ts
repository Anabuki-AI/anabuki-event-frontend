import type { ConfidenceLevel, ConfidenceMultipliers, Question } from '../types'
import { request } from '~/lib/api/client'

const credentials = 'include' as const

/** POST / PUT に送る問題の入力値。 */
export interface QuestionPayload {
  questionText: string
  choiceA: string
  choiceB: string
  choiceC: string
  choiceD: string
  correctAnswer: Question['correctAnswer']
  explanation: string
  targetAudience: string
  /** 配点。この問題に正解した場合の基礎得点。 */
  points: number
  /** 新しい画像ファイル。未指定なら既存の画像を変更しない。 */
  image?: File | null
  /** 既存の画像を削除する場合に true を送る。 */
  removeImage?: boolean
}

/**
 * multipart/form-data で送信するため FormData に変換する。
 * $fetch (ofetch) は FormData をそのまま渡すとブラウザが境界付きの
 * Content-Type を設定してくれるため、JSON.stringify は行わない。
 */
function toFormData(payload: QuestionPayload): FormData {
  const formData = new FormData()
  formData.append('questionText', payload.questionText)
  formData.append('choiceA', payload.choiceA)
  formData.append('choiceB', payload.choiceB)
  formData.append('choiceC', payload.choiceC)
  formData.append('choiceD', payload.choiceD)
  formData.append('correctAnswer', payload.correctAnswer)
  formData.append('explanation', payload.explanation)
  formData.append('targetAudience', payload.targetAudience)
  formData.append('points', String(payload.points))
  if (payload.image) formData.append('image', payload.image)
  if (payload.removeImage) formData.append('removeImage', 'true')
  return formData
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
    body: toFormData(payload),
    credentials,
  })
}

export function updateQuestion(id: number, payload: QuestionPayload): Promise<Question> {
  return request<Question>(`/admin/questions/${id}`, {
    method: 'PUT',
    body: toFormData(payload),
    credentials,
  })
}

/**
 * question.imageUrl は、アップロード画像の場合は API 相対パス
 * （例: /admin/questions/1/image）、旧方式の外部URL貼り付けの場合は
 * 完全な http(s) URL のいずれかを返す。表示用に絶対URLへ解決する。
 */
export function resolveQuestionImageUrl(imageUrl: string | null): string | null {
  if (!imageUrl) return null
  if (/^https?:\/\//i.test(imageUrl)) return imageUrl

  const config = useRuntimeConfig()
  return `${config.public.apiBase}${imageUrl}`
}

export async function deleteQuestion(id: number): Promise<void> {
  await request<null>(`/admin/questions/${id}`, {
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
