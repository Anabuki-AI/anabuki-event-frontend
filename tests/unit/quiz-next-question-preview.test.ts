import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import QuizNextQuestionPreview from '../../app/features/quiz-control/components/QuizNextQuestionPreview.vue'
import type { OperatorNextQuestion } from '../../app/features/quiz-control/types'

const nextQuestion: OperatorNextQuestion = {
  question_id: 3,
  position: 3,
  question_text: '次の問題文',
  choices: { A: 'あ', B: 'い', C: 'う', D: 'え' },
  image_url: null,
}

describe('QuizNextQuestionPreview', () => {
  it('次の問題がある場合は問題文・選択肢をコンパクトに表示し、正解は表示しない', () => {
    const wrapper = mount(QuizNextQuestionPreview, { props: { nextQuestion } })

    expect(wrapper.find('.quiz-next-preview-id').text()).toBe('Q3')
    expect(wrapper.find('.quiz-next-preview-text').text()).toBe('次の問題文')
    expect(wrapper.findAll('.quiz-next-preview-choices li')).toHaveLength(4)
    expect(wrapper.text()).toContain('あ')
    expect(wrapper.text()).not.toContain('correct')
    expect(wrapper.find('.quiz-next-preview-image').exists()).toBe(false)
  })

  it('画像がある場合は表示する', () => {
    const wrapper = mount(QuizNextQuestionPreview, {
      props: { nextQuestion: { ...nextQuestion, image_url: 'https://example.com/q3.png' } },
    })
    expect(wrapper.find('.quiz-next-preview-image').attributes('src')).toBe('https://example.com/q3.png')
  })

  it('次の問題がない場合は空状態を表示する', () => {
    const wrapper = mount(QuizNextQuestionPreview, { props: { nextQuestion: null } })

    expect(wrapper.find('.quiz-next-preview-empty').text()).toBe('次の問題はありません。')
    expect(wrapper.find('.quiz-next-preview-card').exists()).toBe(false)
  })
})
