import { computed, ref } from 'vue'
import type { QuestionChoice, VotingRateQuestion } from './types'

// TODO: API接続後に実データへ置き換え
const dummyQuestions: VotingRateQuestion[] = [
  {
    value: 'q1',
    number: 'Q1',
    text: '日本の首都はどこでしょう？',
    participantCount: 48,
    options: [
      { key: 'A', label: '選択肢A', text: '東京都', votes: 28, rate: 62 },
      { key: 'B', label: '選択肢B', text: '大阪府', votes: 9, rate: 20 },
      { key: 'C', label: '選択肢C', text: '愛知県', votes: 5, rate: 11 },
      { key: 'D', label: '選択肢D', text: '福岡県', votes: 3, rate: 7 },
    ],
  },
  {
    value: 'q2',
    number: 'Q2',
    text: '四国で面積が最も大きい県はどこでしょう？',
    participantCount: 48,
    options: [
      { key: 'A', label: '選択肢A', text: '東京都', votes: 6, rate: 13 },
      { key: 'B', label: '選択肢B', text: '大阪府', votes: 4, rate: 9 },
      { key: 'C', label: '選択肢C', text: '愛知県', votes: 8, rate: 18 },
      { key: 'D', label: '選択肢D', text: '福岡県', votes: 12, rate: 27 },
    ],
  },
  {
    value: 'q3',
    number: 'Q3',
    text: '世界で最も人口が多い国はどこでしょう？',
    participantCount: 48,
    options: [
      { key: 'A', label: '選択肢A', text: '東京都', votes: 15, rate: 34 },
      { key: 'B', label: '選択肢B', text: '大阪府', votes: 10, rate: 23 },
      { key: 'C', label: '選択肢C', text: '愛知県', votes: 7, rate: 16 },
      { key: 'D', label: '選択肢D', text: '福岡県', votes: 2, rate: 5 },
    ],
  },
]

function cloneQuestions(source: VotingRateQuestion[]): VotingRateQuestion[] {
  return source.map(question => ({
    ...question,
    options: question.options.map(option => ({ ...option })),
  }))
}

function createQuestionChoices(questions: VotingRateQuestion[]): QuestionChoice[] {
  return questions.map(question => ({ value: question.value, label: question.number }))
}

function firstQuestion(questions: VotingRateQuestion[]): VotingRateQuestion {
  const first = questions[0]
  if (!first) {
    throw new Error('投票率データが1件も存在しません')
  }
  return first
}

function findQuestion(questions: VotingRateQuestion[], value: string): VotingRateQuestion {
  return questions.find(question => question.value === value) ?? firstQuestion(questions)
}

export function useVotingRate() {
  const questions = ref<VotingRateQuestion[]>(cloneQuestions(dummyQuestions))
  const selectedQuestionValue = ref(firstQuestion(questions.value).value)

  const questionChoices = computed<QuestionChoice[]>(() => createQuestionChoices(questions.value))
  const currentQuestion = computed<VotingRateQuestion>(() =>
    findQuestion(questions.value, selectedQuestionValue.value),
  )

  const participantCount = computed(() => currentQuestion.value.participantCount)
  const answeredCount = computed(() =>
    currentQuestion.value.options.reduce((total, option) => total + option.votes, 0),
  )
  const unansweredCount = computed(() => Math.max(participantCount.value - answeredCount.value, 0))

  const options = computed(() => currentQuestion.value.options)

  // TODO: API接続後に実装（APIから投票率データを取得して questions を更新する）
  function loadVotingRate() {
    questions.value = cloneQuestions(dummyQuestions)
  }

  function refresh() {
    loadVotingRate()
  }

  return {
    questionChoices,
    selectedQuestionValue,
    currentQuestion,
    participantCount,
    answeredCount,
    unansweredCount,
    options,
    refresh,
  }
}
