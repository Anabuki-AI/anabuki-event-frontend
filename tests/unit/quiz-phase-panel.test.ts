import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import QuizPhasePanel from '../../app/features/quiz-control/components/QuizPhasePanel.vue'
import type { OperatorQuizState } from '../../app/features/quiz-control/types'

const currentQuestion = {
  question_id: 12,
  position: 2,
  question_text: 'Q2',
  choices: { A: 'a', B: 'b', C: 'c', D: 'd' },
  image_url: null,
  correct_answer: 'B' as const,
  answered_count: 0,
  answered_rate: 0,
}

function makeState(overrides: Partial<OperatorQuizState>): OperatorQuizState {
  return {
    status: 'waiting',
    phase: null,
    current: null,
    question_count: 3,
    total_participants: 60,
    next_question: null,
    ...overrides,
  }
}

function mountPanel(state: OperatorQuizState) {
  return mount(QuizPhasePanel, { props: { state, isActing: false } })
}

describe('QuizPhasePanel のAPI状態別描画', () => {
  it('waiting では「イベント開始」ボタンを表示する', () => {
    expect(mountPanel(makeState({})).find('.quiz-action-button').text()).toBe('イベント開始')
  })

  it('in_progress/answering では「解答締め切り」ボタンを表示する', () => {
    const wrapper = mountPanel(makeState({ status: 'in_progress', phase: 'answering', current: currentQuestion }))
    expect(wrapper.find('.quiz-action-button').text()).toBe('解答締め切り')
  })

  it('closing ではカウントダウン中の案内だけを表示する', () => {
    const wrapper = mountPanel(makeState({ status: 'in_progress', phase: 'closing', current: currentQuestion }))
    expect(wrapper.find('.quiz-action-button').exists()).toBe(false)
    expect(wrapper.find('.quiz-phase-done').text()).toContain('カウントダウン中')
  })

  it('closed では「答え表示」ボタンを表示する', () => {
    const wrapper = mountPanel(makeState({ status: 'in_progress', phase: 'closed', current: currentQuestion }))
    expect(wrapper.find('.quiz-action-button').text()).toBe('答え表示')
  })

  it('revealed で次問があれば「次の問題を公開」を表示する', () => {
    const wrapper = mountPanel(makeState({
      status: 'in_progress',
      phase: 'revealed',
      current: { ...currentQuestion, position: 1 },
      next_question: {
        question_id: 13,
        position: 3,
        question_text: 'Q3',
        choices: { A: 'a', B: 'b', C: 'c', D: 'd' },
        image_url: null,
      },
      question_count: 3,
    }))
    expect(wrapper.find('.quiz-action-button').text()).toBe('次の問題を公開')
  })

  it('revealed で最終問なら「クイズを終了」を表示する', () => {
    const wrapper = mountPanel(makeState({
      status: 'in_progress',
      phase: 'revealed',
      current: { ...currentQuestion, position: 3 },
      question_count: 3,
    }))
    expect(wrapper.find('.quiz-action-button').text()).toBe('クイズを終了')
  })

  it('finished では操作を表示せず終了を案内する', () => {
    const wrapper = mountPanel(makeState({ status: 'finished', current: null }))
    expect(wrapper.find('.quiz-action-button').exists()).toBe(false)
    expect(wrapper.find('.quiz-phase-done').text()).toContain('クイズ大会は終了しました')
  })

  it('ボタン押下で対応するemitが発火する', async () => {
    const wrapper = mountPanel(makeState({ status: 'in_progress', phase: 'closed', current: currentQuestion }))
    await wrapper.find('.quiz-action-button').trigger('click')
    expect(wrapper.emitted('reveal')).toHaveLength(1)
  })

  it('終了ボタン押下でfinishイベントが発火する', async () => {
    const wrapper = mountPanel(makeState({
      status: 'in_progress',
      phase: 'revealed',
      current: { ...currentQuestion, position: 3 },
      question_count: 3,
    }))
    await wrapper.find('.quiz-action-button').trigger('click')
    expect(wrapper.emitted('finish')).toHaveLength(1)
  })
})
