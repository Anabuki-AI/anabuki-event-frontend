import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import QuizCurrentQuestionCard from '../../app/features/quiz-control/components/QuizCurrentQuestionCard.vue'
import type { OperatorQuizState } from '../../app/features/quiz-control/types'

function buildState(phase: 'answering' | 'revealed', explanation: string | null): OperatorQuizState {
  return {
    status: 'in_progress',
    phase,
    current: {
      question_id: 1,
      position: 1,
      question_text: 'Q',
      choices: { A: 'a', B: 'b', C: 'c', D: 'd' },
      image_url: null,
      correct_answer: 'B',
      explanation,
      answered_count: 0,
      answered_rate: 0,
    },
    next_question: null,
    question_count: 1,
    total_participants: 0,
  } as unknown as OperatorQuizState
}

describe('QuizCurrentQuestionCard explanation', () => {
  it('解答表示後は解説を表示する', () => {
    const wrapper = mount(QuizCurrentQuestionCard, { props: { state: buildState('revealed', 'Bが正しい理由') } })
    expect(wrapper.find('.quiz-answer-explanation').text()).toContain('Bが正しい理由')
  })

  it('解答表示前は解説を表示しない', () => {
    const wrapper = mount(QuizCurrentQuestionCard, { props: { state: buildState('answering', 'Bが正しい理由') } })
    expect(wrapper.find('.quiz-answer-explanation').exists()).toBe(false)
  })

  it('解説が未設定なら表示しない', () => {
    const wrapper = mount(QuizCurrentQuestionCard, { props: { state: buildState('revealed', null) } })
    expect(wrapper.find('.quiz-answer-explanation').exists()).toBe(false)
  })
})
