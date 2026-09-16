import type { QuizState } from '../types'
import { request } from '~/lib/api/client'
import {
  mockCloseAnswers,
  mockFetchQuizState,
  mockPublishQuestion,
  mockRevealAnswer,
  mockStartQuiz,
} from '../mock'

/**
 * バックエンドAPI(/api/admin/quiz)未結合でも画面を確認できるよう
 * 仮データ・擬似遷移を返すフラグ。実API結合時に false にする。
 */
const USE_MOCK = true

export async function fetchQuizState(): Promise<QuizState> {
  if (USE_MOCK) {
    return mockFetchQuizState()
  }
  return request<QuizState>('/admin/quiz/state')
}

async function act(mockAction: () => Promise<QuizState>, path: string): Promise<QuizState> {
  if (USE_MOCK) {
    return mockAction()
  }
  return request<QuizState>(path, { method: 'POST' })
}

export function startQuiz(): Promise<QuizState> {
  return act(mockStartQuiz, '/admin/quiz/start')
}

export function publishQuestion(): Promise<QuizState> {
  return act(mockPublishQuestion, '/admin/quiz/publish')
}

export function closeAnswers(): Promise<QuizState> {
  return act(mockCloseAnswers, '/admin/quiz/close')
}

export function revealAnswer(): Promise<QuizState> {
  return act(mockRevealAnswer, '/admin/quiz/reveal')
}
