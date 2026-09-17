import type { QuizState } from '../types'
import { request } from '~/lib/api/client'

const credentials = 'include' as const

/** manager Cookie を使う運営者クイズ進行API。 */
export function fetchQuizState(): Promise<QuizState> {
  return request<QuizState>('/operator/quiz/state', { credentials, retry: 0 })
}

function act(path: string): Promise<QuizState> {
  return request<QuizState>(path, { method: 'POST', credentials, retry: 0 })
}

export function startQuiz(): Promise<QuizState> {
  return act('/operator/quiz/start')
}

export function publishQuestion(): Promise<QuizState> {
  return act('/operator/quiz/publish')
}

export function closeAnswers(): Promise<QuizState> {
  return act('/operator/quiz/close')
}

export function revealAnswer(): Promise<QuizState> {
  return act('/operator/quiz/reveal')
}
