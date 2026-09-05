import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import QuizPhasePanel from '../../app/features/quiz-control/components/QuizPhasePanel.vue'
import type { QuizState } from '../../app/features/quiz-control/types'

function makeState(overrides: Partial<QuizState>): QuizState {
  return {
    phase: 'IDLE',
    currentQuestion: null,
    nextQuestion: null,
    totalQuestions: 3,
    startedAt: null,
    publishedAt: null,
    closedAt: null,
    revealedAt: null,
    ...overrides,
  }
}

function mountPanel(state: QuizState) {
  return mount(QuizPhasePanel, {
    props: { state, isActing: false },
  })
}

describe('QuizPhasePanel', () => {
  it('IDLE: イベント開始ボタンを表示する', async () => {
    const wrapper = mountPanel(makeState({}))

    const button = wrapper.find('button.quiz-action-button')
    expect(button.text()).toBe('イベント開始')

    await button.trigger('click')
    expect(wrapper.emitted('start')).toHaveLength(1)
  })

  it('PUBLISHING: 解答締め切りボタンを表示する', async () => {
    const wrapper = mountPanel(makeState({
      phase: 'PUBLISHING',
      currentQuestion: {
        id: 1,
        questionText: '問題',
        choices: { A: 'a', B: 'b', C: 'c', D: 'd' },
        correctAnswer: 'A',
        confidenceMultiplier: '1.00',
      },
      startedAt: new Date().toISOString(),
      publishedAt: new Date().toISOString(),
    }))

    const button = wrapper.find('button.quiz-action-button')
    expect(button.text()).toBe('解答締め切り')

    await button.trigger('click')
    expect(wrapper.emitted('close')).toHaveLength(1)
  })

  it('CLOSED: 答え表示ボタンを表示する', () => {
    const wrapper = mountPanel(makeState({
      phase: 'CLOSED',
      publishedAt: new Date().toISOString(),
      closedAt: new Date().toISOString(),
    }))

    expect(wrapper.find('button.quiz-action-button').text()).toBe('答え表示')
  })

  it('REVEALED: 次の問題があるなら「次の問題を公開」を表示する', () => {
    const next = {
      id: 2,
      questionText: '次の問題',
      choices: { A: 'a', B: 'b', C: 'c', D: 'd' },
      correctAnswer: 'B',
      confidenceMultiplier: '1.00',
    }
    const wrapper = mountPanel(makeState({
      phase: 'REVEALED',
      nextQuestion: next,
      publishedAt: new Date().toISOString(),
      closedAt: new Date().toISOString(),
      revealedAt: new Date().toISOString(),
    }))

    expect(wrapper.find('button.quiz-action-button').text()).toBe('次の問題を公開')
  })

  it('ENDED: アクションボタンを消して完了メッセージを出す', () => {
    const wrapper = mountPanel(makeState({
      phase: 'ENDED',
    }))

    expect(wrapper.find('button.quiz-action-button').exists()).toBe(false)
    expect(wrapper.find('.quiz-phase-done').text()).toContain('すべての問題を出題し終えました')
  })

  it('進行ステップを現在フェーズで強調する', () => {
    const wrapper = mountPanel(makeState({
      phase: 'PUBLISHING',
      startedAt: new Date().toISOString(),
      publishedAt: new Date().toISOString(),
    }))

    const steps = wrapper.findAll('.quiz-phase-step')
    expect(steps[0].classes()).toContain('is-done')
    expect(steps[1].classes()).toContain('is-current')
    expect(steps[2].classes()).toContain('is-todo')
  })
})
