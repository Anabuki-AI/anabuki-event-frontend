import type { ConfidenceLevel, ConfidenceMultipliers, Question } from '../types'
import { request } from '~/lib/api/client'
import { resolveApiImageUrl } from '~/lib/api/image'

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
  isRelayQuestion?: boolean
  /** 中継問題を今回の出題として選択するかどうか。undefined の場合は送信しない(既存値を変更しない)。 */
  isSelectedRelayQuestion?: boolean
  /** 配点。この問題に正解した場合の基礎得点。 */
  points: number
  /**
   * 制限時間(秒)。null で「制限時間なし」。
   * 運営クイズAPI(OperatorQuizCurrentQuestion.time_limit_seconds)と揃えるため、
   * このフィールドだけ他のcamelCase項目と異なり time_limit_seconds のsnake_caseで送信する。
   * undefined の場合は送信しない(既存値を変更しない)。
   */
  timeLimitSeconds?: number | null
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
  if (payload.isRelayQuestion !== undefined) {
    formData.append('isRelayQuestion', String(payload.isRelayQuestion))
  }
  if (payload.isSelectedRelayQuestion !== undefined) {
    formData.append('isSelectedRelayQuestion', String(payload.isSelectedRelayQuestion))
  }
  formData.append('points', String(payload.points))
  if (payload.timeLimitSeconds !== undefined) {
    formData.append('time_limit_seconds', payload.timeLimitSeconds === null ? '' : String(payload.timeLimitSeconds))
  }
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
 * 問題管理の一覧(management.vue)から、中継問題の「今回出題する1問」の
 * 選択/選択解除だけを行うためのヘルパー。
 * 更新APIは全項目を送るPUTのみのため、一覧に読み込み済みの Question から
 * 画像以外の全項目を引き継いだペイロードを組み立てて再送する
 * (image/removeImage を省略するので既存の画像は変更されない)。
 */
export function selectRelayQuestion(question: Question, selected: boolean): Promise<Question> {
  const payload: QuestionPayload = {
    questionText: question.questionText,
    choiceA: question.choiceA,
    choiceB: question.choiceB,
    choiceC: question.choiceC,
    choiceD: question.choiceD,
    correctAnswer: question.correctAnswer,
    explanation: question.explanation ?? '',
    targetAudience: question.targetAudience ?? '',
    isRelayQuestion: question.isRelayQuestion,
    isSelectedRelayQuestion: selected,
    points: question.points,
    timeLimitSeconds: question.timeLimitSeconds,
  }
  return updateQuestion(question.id, payload)
}

/** 問題管理・クイズAPIの画像フィールドを表示用URLへ解決する。 */
export const resolveQuestionImageUrl = resolveApiImageUrl

export async function deleteQuestion(id: number): Promise<void> {
  await request<null>(`/admin/questions/${id}`, {
    method: 'DELETE',
    credentials,
  })
}

export interface BulkDeleteQuestionsResult {
  deletedCount: number
  deletedIds: number[]
}

/**
 * 複数の問題を一括削除する(全件成功か全件失敗)。
 * 単体削除と異なり、公開済み・回答済み・出題中の問題も削除する(回答・自信度記録も連動削除)。
 * DELETE ボディはプロキシ経由で落ちやすいため POST で送る。
 */
export function bulkDeleteQuestions(ids: number[]): Promise<BulkDeleteQuestionsResult> {
  return request<BulkDeleteQuestionsResult>('/admin/questions/bulk_destroy', {
    method: 'POST',
    credentials,
    body: { ids },
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
