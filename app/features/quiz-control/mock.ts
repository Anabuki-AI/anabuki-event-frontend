import { ApiError } from '~/lib/api/error'
import type { QuizPhase, QuizQuestion, QuizState } from './types'

/**
 * バックエンドのクイズ進行API(/api/admin/quiz)未結合時に使う仮データと擬似API。
 * 実API連携への切替は api/client.ts の USE_MOCK を false にする。
 */

const MOCK_QUESTIONS: QuizQuestion[] = [
  {
    id: 1,
    questionText: '穴吹カレッジのAIテクノロジー学科がある県はどこでしょう？',
    choices: { A: '香川県', B: '徳島県', C: '愛媛県', D: '高知県' },
    correctAnswer: 'B',
    confidenceMultiplier: '1.00',
  },
  {
    id: 2,
    questionText: '四国で唯一の政令指定都市はどこでしょう？',
    choices: { A: '高松市', B: '松山市', C: '徳島市', D: '高知市' },
    correctAnswer: 'B',
    confidenceMultiplier: '1.50',
  },
  {
    id: 3,
    questionText: 'うどんの消費量が日本一とされる県はどこでしょう？',
    choices: { A: '徳島県', B: '愛媛県', C: '香川県', D: '高知県' },
    correctAnswer: 'C',
    confidenceMultiplier: '0.80',
  },
]

/** モック内部の進行状態。ページリロードでリセットされる */
const mockState = {
  phase: 'IDLE' as QuizPhase,
  currentIndex: -1, // -1 = 未公開
  startedAt: null as string | null,
  publishedAt: null as string | null,
  closedAt: null as string | null,
  revealedAt: null as string | null,
}

function nowIso(): string {
  return new Date().toISOString()
}

function currentQuestion(): QuizQuestion | null {
  return mockState.currentIndex >= 0
    ? MOCK_QUESTIONS[mockState.currentIndex] ?? null
    : null
}

function nextQuestion(): QuizQuestion | null {
  const next = mockState.currentIndex + 1
  return next < MOCK_QUESTIONS.length
    ? MOCK_QUESTIONS[next] ?? null
    : null
}

function snapshot(): QuizState {
  return {
    phase: mockState.phase,
    currentQuestion: currentQuestion(),
    nextQuestion: nextQuestion(),
    totalQuestions: MOCK_QUESTIONS.length,
    startedAt: mockState.startedAt,
    publishedAt: mockState.publishedAt,
    closedAt: mockState.closedAt,
    revealedAt: mockState.revealedAt,
  }
}

/** フェーズ遷移違反。実APIと同じ409失敗を再現する */
export class QuizStateError extends ApiError {
  constructor(message: string) {
    super(message, 409)
    this.name = 'QuizStateError'
  }
}

function requirePhase(phase: QuizPhase): void {
  if (mockState.phase !== phase) {
    throw new QuizStateError(`操作の順序が不正です（現在: ${phase}）`)
  }
}

export async function mockFetchQuizState(): Promise<QuizState> {
  return snapshot()
}

export async function mockStartQuiz(): Promise<QuizState> {
  requirePhase('IDLE')
  if (mockState.startedAt !== null) {
    throw new QuizStateError('イベントはすでに開始済みです')
  }
  mockState.startedAt = nowIso()
  return snapshot()
}

export async function mockPublishQuestion(): Promise<QuizState> {
  // IDLE(未開始)からの公開は開始を兼ねる。REVEALEDからの公開は次問題へ
  if (mockState.phase !== 'IDLE' && mockState.phase !== 'REVEALED') {
    throw new QuizStateError(`このフェーズでは問題を公開できません（現在: ${mockState.phase}）`)
  }
  if (nextQuestion() === null) {
    throw new QuizStateError('公開できる次の問題がありません')
  }
  mockState.currentIndex += 1
  mockState.phase = 'PUBLISHING'
  mockState.publishedAt = nowIso()
  mockState.closedAt = null
  mockState.revealedAt = null
  return snapshot()
}

export async function mockCloseAnswers(): Promise<QuizState> {
  requirePhase('PUBLISHING')
  mockState.phase = 'CLOSED'
  mockState.closedAt = nowIso()
  return snapshot()
}

export async function mockRevealAnswer(): Promise<QuizState> {
  requirePhase('CLOSED')
  mockState.phase = 'REVEALED'
  mockState.revealedAt = nowIso()
  return snapshot()
}
