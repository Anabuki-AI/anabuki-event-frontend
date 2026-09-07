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

describe('QuizPhasePanel のフェーズ別描画', () => {
  it('IDLE では「イベント開始」ボタンを表示する', () => {
    const wrapper = mountPanel(makeState({}))

    const button = wrapper.find('.quiz-action-button')
    expect(button.text()).toBe('イベント開始')
  })

  it('IDLE で開始済み（startedAtあり）では「問題公開」ボタンに切り替わる', async () => {
    const wrapper = mountPanel(makeState({ startedAt: '2026-09-07T12:00:00Z' }))

    expect(wrapper.find('.quiz-action-button').text()).toBe('問題公開')
  })

  it('PUBLISHING では「解答締め切り」ボタンを表示する', () => {
    const wrapper = mountPanel(makeState({
      phase: 'PUBLISHING',
      currentQuestion: {
        id: 1,
        questionText: 'Q1',
        choices: { A: 'a', B: 'b', C: 'c', D: 'd' },
        correctAnswer: 'A',
        confidenceMultiplier: '1.00',
      },
      startedAt: '2026-09-07T12:00:00Z',
      publishedAt: '2026-09-07T12:01:00Z',
    }))

    expect(wrapper.find('.quiz-action-button').text()).toBe('解答締め切り')
  })

  it('CLOSED では「答え表示」ボタンを表示する', () => {
    const wrapper = mountPanel(makeState({
      phase: 'CLOSED',
      startedAt: '2026-09-07T12:00:00Z',
      publishedAt: '2026-09-07T12:01:00Z',
      closedAt: '2026-09-07T12:03:00Z',
    }))

    expect(wrapper.find('.quiz-action-button').text()).toBe('答え表示')
  })

  it('REVEALED で次問題があれば「次の問題を公開」を表示する', () => {
    const wrapper = mountPanel(makeState({
      phase: 'REVEALED',
      nextQuestion: {
        id: 2,
        questionText: 'Q2',
        choices: { A: 'a', B: 'b', C: 'c', D: 'd' },
        correctAnswer: 'B',
        confidenceMultiplier: '1.00',
      },
    }))

    expect(wrapper.find('.quiz-action-button').text()).toBe('次の問題を公開')
  })

  it('ENDED ではアクションボタンを消し完了メッセージを出す', () => {
    const wrapper = mountPanel(makeState({ phase: 'ENDED' }))

    expect(wrapper.find('.quiz-action-button').exists()).toBe(false)
    expect(wrapper.find('.quiz-phase-done').text()).toContain('お疲れさまでした')
  })

  it('現在フェーズのステップを強調し、完了ステップに ✓ を付ける', () => {
    const wrapper = mountPanel(makeState({ phase: 'CLOSED' }))

    const stepClasses = wrapper.findAll('.quiz-phase-step').map(step => step.classes())
    expect(stepClasses[0]).toContain('is-done')
    expect(stepClasses[1]).toContain('is-done')
    expect(stepClasses[2]).toContain('is-current')
    expect(stepClasses[3]).toContain('is-todo')
    expect(wrapper.find('.quiz-phase-step.is-done .quiz-phase-marker').text()).toBe('✓')
  })

  it('ボタン押下で対応する emit が発火する', async () => {
    const wrapper = mountPanel(makeState({ phase: 'PUBLISHING' }))

    await wrapper.find('.quiz-action-button').trigger('click')
    expect(wrapper.emitted('close')).toHaveLength(1)
  })
})
