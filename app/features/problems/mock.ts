import type { Question } from './types'

/**
 * バックエンドの問題API未結合時に使う仮データ。
 * 実API連携の有効化は pages/admin/problems/index.vue の USE_MOCK を false にする。
 */
export const MOCK_QUESTIONS: Question[] = [
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
  {
    id: 4,
    questionText: '四国の面積が最も大きい県はどこでしょう？',
    choices: { A: '愛媛県', B: '香川県', C: '徳島県', D: '高知県' },
    correctAnswer: 'D',
    confidenceMultiplier: '2.00',
  },
  {
    id: 5,
    questionText: '鳴門海峡の渦潮で有名なのはどの県の海峡でしょう？',
    choices: { A: '徳島県', B: '香川県', C: '愛媛県', D: '高知県' },
    correctAnswer: 'A',
    confidenceMultiplier: '1.20',
  },
]
