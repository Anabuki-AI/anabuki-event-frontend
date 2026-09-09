import type { QuizState } from '../types'
import { request } from '~/lib/api/client'

export async function fetchQuizState(): Promise<QuizState> {
  return request<QuizState>('/admin/quiz/state')
}

async function act(path: string): Promise<QuizState> {
  return request<QuizState>(path, { method: 'POST' })
}

export function startQuiz(): Promise<QuizState> {
  return act('/admin/quiz/start')
}

export function publishQuestion(): Promise<QuizState> {
  return act('/admin/quiz/publish')
}

export function closeAnswers(): Promise<QuizState> {
  return act('/admin/quiz/close')
}

export function revealAnswer(): Promise<QuizState> {
  return act('/admin/quiz/reveal')
}

export function endQuiz(): Promise<QuizState> {
  return act('/admin/quiz/end')
}
