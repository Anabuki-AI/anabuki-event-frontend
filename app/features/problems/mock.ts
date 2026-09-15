import { ApiError } from '~/lib/api/error'
import type { QuestionPayload } from './api/client'
import { CONFIDENCE_MULTIPLIER_DEFAULTS, formatMultiplier } from './constants'
import type { ConfidenceLevel, ConfidenceMultipliers, Question } from './types'

/**
 * バックエンドの問題API未結合時に使う仮データ。
 * 実API連携への切替は api/client.ts の USE_MOCK を false にする。
 */
const mockQuestions: Question[] = [
  {
    id: 1,
    questionText: '穴吹カレッジのAIテクノロジー学科がある県はどこでしょう？',
    choices: { A: '香川県', B: '徳島県', C: '愛媛県', D: '高知県' },
    correctAnswer: 'B',
  },
  {
    id: 2,
    questionText: '四国で唯一の政令指定都市はどこでしょう？',
    choices: { A: '高松市', B: '松山市', C: '徳島市', D: '高知市' },
    correctAnswer: 'B',
  },
  {
    id: 3,
    questionText: 'うどんの消費量が日本一とされる県はどこでしょう？',
    choices: { A: '徳島県', B: '愛媛県', C: '香川県', D: '高知県' },
    correctAnswer: 'C',
  },
  {
    id: 4,
    questionText: '四国の面積が最も大きい県はどこでしょう？',
    choices: { A: '愛媛県', B: '香川県', C: '徳島県', D: '高知県' },
    correctAnswer: 'D',
  },
  {
    id: 5,
    questionText: '鳴門海峡の渦潮で有名なのはどの県の海峡でしょう？',
    choices: { A: '徳島県', B: '香川県', C: '愛媛県', D: '高知県' },
    correctAnswer: 'A',
  },
]

// 自信度倍率は問題ごとではなく、「自信度あり/普通/なし」3段階共通の設定として持つ
const mockConfidenceMultipliers: ConfidenceMultipliers = { ...CONFIDENCE_MULTIPLIER_DEFAULTS }

function findMockQuestion(id: number): Question {
  const found = mockQuestions.find(question => question.id === id)
  if (found == null) {
    throw new ApiError(`問題Q${id}が見つかりません`, 404)
  }
  return found
}

export async function fetchMockQuestions(): Promise<Question[]> {
  return [...mockQuestions]
}

export async function fetchMockQuestion(id: number): Promise<Question> {
  return { ...findMockQuestion(id) }
}

export async function createMockQuestion(payload: QuestionPayload): Promise<Question> {
  const nextId = Math.max(0, ...mockQuestions.map(question => question.id)) + 1
  const created: Question = {
    id: nextId,
    questionText: payload.questionText,
    choices: { ...payload.choices },
    correctAnswer: payload.correctAnswer,
  }
  mockQuestions.push(created)
  return { ...created }
}

export async function updateMockQuestion(id: number, payload: QuestionPayload): Promise<Question> {
  const found = findMockQuestion(id)
  found.questionText = payload.questionText
  found.choices = { ...payload.choices }
  found.correctAnswer = payload.correctAnswer
  return { ...found }
}

export async function fetchMockConfidenceMultipliers(): Promise<ConfidenceMultipliers> {
  return { ...mockConfidenceMultipliers }
}

export async function updateMockConfidenceMultiplier(level: ConfidenceLevel, value: string): Promise<ConfidenceMultipliers> {
  mockConfidenceMultipliers[level] = formatMultiplier(value)
  return { ...mockConfidenceMultipliers }
}
