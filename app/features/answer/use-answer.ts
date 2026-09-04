import { computed, ref } from 'vue'

export type Confidence = 'あり' | '普通' | 'なし'

export interface ConfidenceOption {
  label: Confidence
  rate: string
}

// 見た目確認用のダミーデータ（API連携なし）
export const question = {
  number: 'Q1',
  text: '日本の首都はどこでしょう？',
}

export const choices = [
  { key: 'A', text: '東京都' },
  { key: 'B', text: '大阪府' },
  { key: 'C', text: '愛知県' },
  { key: 'D', text: '福岡県' },
]

export const confidenceOptions: ConfidenceOption[] = [
  { label: 'あり', rate: '×1.5' },
  { label: '普通', rate: '×1.0' },
  { label: 'なし', rate: '×0.5' },
]

// 自信度ごとの予定獲得ポイント（UI確認用のダミー計算・実際の得点計算は行わない）
const CONFIDENCE_POINTS: Record<Confidence, number> = {
  あり: 150,
  普通: 100,
  なし: 50,
}

/**
 * 解答画面の状態と操作（解答選択・自信度選択・予定獲得ポイント・送信済み切替）。
 * API通信は行わず、フロントエンドの状態のみを扱う。
 */
export function useAnswer() {
  // TODO: API接続後に実データへ置き換え
  const userName = ref('UserName')

  const selectedChoice = ref<number | null>(null)
  const confidence = ref<Confidence>('普通')
  const submitted = ref(false)

  const selectedChoiceText = computed(() => {
    const choice = selectedChoice.value === null ? undefined : choices[selectedChoice.value]

    if (!choice)
      return '未選択'

    return `${choice.key}. ${choice.text}`
  })

  const expectedPoint = computed(() => CONFIDENCE_POINTS[confidence.value])

  function selectChoice(index: number) {
    selectedChoice.value = index
  }

  function selectConfidence(label: Confidence) {
    confidence.value = label
  }

  function submitAnswer() {
    if (selectedChoice.value === null)
      return

    // API通信は行わず、フロントエンドの状態のみ送信後画面へ切り替える
    submitted.value = true
  }

  return {
    userName,
    question,
    choices,
    confidenceOptions,
    selectedChoice,
    confidence,
    submitted,
    selectedChoiceText,
    expectedPoint,
    selectChoice,
    selectConfidence,
    submitAnswer,
  }
}
