import type { ChoiceKey, Question } from './types'

export const CHOICE_KEYS = ['A', 'B', 'C', 'D'] as const satisfies readonly ChoiceKey[]

export const QUESTION_TEXT_MAX = 200

// 「保存中…」が見える程度の疑似遅延。API実装後は実API呼び出しに差し替える
export const SAVE_DELAY_MS = 400

// キャンセル時の戻り先。問題管理画面(未作成)追加後に '/questions' へ差し替える
export const CANCEL_ROUTE = '/'

// 画面構成イメージ用のモックデータ。バックエンドの問題API未実装のため直接埋め込む
export const MOCK_QUESTION: Question = {
  id: 1,
  questionText: '日本の首都はどこでしょう?',
  choices: { A: '東京', B: '大阪', C: '札幌', D: '福岡' },
  correctAnswer: 'A',
}
