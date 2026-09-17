import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import QuizCurrentQuestionCard from '../../app/features/quiz-control/components/QuizCurrentQuestionCard.vue'
import type { OperatorQuizState } from '../../app/features/quiz-control/types'

const state: OperatorQuizState = {
  status: 'in_progress',
  phase: 'answering',
  current: {
    question_id: 12,
    position: 2,
    question_text: '問題文',
    choices: { A: 'A', B: 'B', C: 'C', D: 'D' },
    image_url: 'https://example.com/question.png',
    correct_answer: 'B',
    answered_count: 0,
    answered_rate: 0,
  },
  question_count: 2,
  total_participants: 10,
  next_question: null,
}

describe('QuizCurrentQuestionCard', () => {
  it('APIの画像URLを現在問題カードに表示する', () => {
    const wrapper = mount(QuizCurrentQuestionCard, { props: { state } })

    expect(wrapper.find('.quiz-question-image').attributes('src')).toBe('https://example.com/question.png')
  })
})
