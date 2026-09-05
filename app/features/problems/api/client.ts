import type { ChoiceKey, Question } from '../types'
import { request } from '~/lib/api/client'

interface QuestionApiModel {
  id: number
  questionText: string
  choiceA: string
  choiceB: string
  choiceC: string
  choiceD: string
  correctAnswer: ChoiceKey
  confidenceMultiplier: string
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
    confidenceMultiplier: model.confidenceMultiplier,
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
  const models = await request<QuestionApiModel[]>('/admin/questions')
  return models.map(toQuestion)
}

export async function fetchQuestion(id: number): Promise<Question> {
  const model = await request<QuestionApiModel>(`/admin/questions/${id}`)
  return toQuestion(model)
}

export async function createQuestion(payload: QuestionPayload): Promise<Question> {
  const model = await request<QuestionApiModel>('/admin/questions', {
    method: 'POST',
    body: toApiModel(payload),
  })
  return toQuestion(model)
}

export async function updateQuestion(id: number, payload: QuestionPayload): Promise<Question> {
  const model = await request<QuestionApiModel>(`/admin/questions/${id}`, {
    method: 'PUT',
    body: toApiModel(payload),
  })
  return toQuestion(model)
}

export async function updateConfidenceMultiplier(id: number, confidenceMultiplier: string): Promise<Question> {
  const model = await request<QuestionApiModel>(`/admin/questions/${id}/confidence-multiplier`, {
    method: 'PATCH',
    body: { confidenceMultiplier: Number(confidenceMultiplier) },
  })
  return toQuestion(model)
}
