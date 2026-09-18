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
    is_relay_question: true,
    is_selected_relay_question: true,
    live_correct_answer_confirmed: true,
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

  it('ライブ中の中継問題では正解を選択してイベントを発火する', async () => {
    const wrapper = mount(QuizCurrentQuestionCard, { props: { state, isActing: false } })

    await wrapper.find('input[value="C"]').setValue(true)

    expect(wrapper.emitted('correctAnswer')).toEqual([['C']])
  })

  it('通常問題にはライブ正解選択UIを表示しない', () => {
    const wrapper = mount(QuizCurrentQuestionCard, {
      props: { state: { ...state, current: { ...state.current!, is_relay_question: false } } },
    })

    expect(wrapper.find('.quiz-live-answer-selector').exists()).toBe(false)
  })

  it('選択されていない中継問題にはライブ正解選択UIを表示しない', () => {
    const wrapper = mount(QuizCurrentQuestionCard, {
      props: { state: { ...state, current: { ...state.current!, is_selected_relay_question: false } } },
    })

    expect(wrapper.find('.quiz-live-answer-selector').exists()).toBe(false)
  })

  it('正解が未確定の中継問題には警告文を表示する', () => {
    const wrapper = mount(QuizCurrentQuestionCard, {
      props: { state: { ...state, current: { ...state.current!, live_correct_answer_confirmed: false } } },
    })

    expect(wrapper.find('.quiz-live-answer-selector-note.is-warning').exists()).toBe(true)
  })

  it('答え表示後は正解選択UIを操作不可にする', () => {
    const wrapper = mount(QuizCurrentQuestionCard, {
      props: { state: { ...state, phase: 'revealed' } },
    })

    expect(wrapper.find('.quiz-live-answer-selector').attributes('disabled')).toBeDefined()
  })
})
