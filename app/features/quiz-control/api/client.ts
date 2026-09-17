import type { OperatorQuizState } from '../types'
import { request } from '~/lib/api/client'

const credentials = 'include' as const

/** オペレーターセッション Cookie を使うクイズ進行API(契約: docs/quiz-session-contract.md)。 */
export function fetchQuizState(): Promise<OperatorQuizState> {
  return request<OperatorQuizState>('/operator/quiz/state', { credentials, retry: 0 })
}

function act(path: string, body?: Record<string, unknown>): Promise<OperatorQuizState> {
  return request<OperatorQuizState>(path, { method: 'POST', body, credentials, retry: 0 })
}

export function startQuiz(): Promise<OperatorQuizState> {
  return act('/operator/quiz/start')
}

export function publishQuestion(): Promise<OperatorQuizState> {
  return act('/operator/quiz/publish')
}

export function closeAnswers(): Promise<OperatorQuizState> {
  return act('/operator/quiz/close')
}

export function revealAnswer(): Promise<OperatorQuizState> {
  return act('/operator/quiz/reveal')
}

export function finishQuiz(): Promise<OperatorQuizState> {
  return act('/operator/quiz/finish')
}
