import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import QuizPhasePanel from '../../app/features/quiz-control/components/QuizPhasePanel.vue'
import type { QuizState } from '../../app/features/quiz-control/types'

const event = {
  id: 1,
  status: 'ACTIVE' as const,
  startedAt: '2026-09-07T12:00:00Z',
  finishedAt: null,
  confidenceMultipliers: { high: '2.00', normal: '1.00', low: '0.50' },
}

const pendingQuestion = {
  id: 2,
  sourceQuestionId: 12,
  position: 2,
  status: 'PENDING' as const,
  questionText: 'Q2',
  choiceA: 'a',
  choiceB: 'b',
  choiceC: 'c',
  choiceD: 'd',
  correctAnswer: 'B' as const,
  imageUrl: null,
  basePoints: 100,
}

function makeState(overrides: Partial<QuizState>): QuizState {
  return { event: null, questions: [], ...overrides }
}

function mountPanel(state: QuizState) {
  return mount(QuizPhasePanel, { props: { state, isActing: false } })
}

describe('QuizPhasePanel のAPI状態別描画', () => {
  it('event: null では「イベント開始」ボタンを表示する', () => {
    expect(mountPanel(makeState({})).find('.quiz-action-button').text()).toBe('イベント開始')
  })

  it('ACTIVEかつ全問PENDINGでは「問題公開」ボタンを表示する', () => {
    expect(mountPanel(makeState({ event, questions: [pendingQuestion] })).find('.quiz-action-button').text()).toBe('問題公開')
  })

  it('PUBLISHEDでは「解答締め切り」ボタンを表示する', () => {
    const wrapper = mountPanel(makeState({
      event,
      questions: [{ ...pendingQuestion, id: 1, position: 1, status: 'PUBLISHED' }, pendingQuestion],
    }))
    expect(wrapper.find('.quiz-action-button').text()).toBe('解答締め切り')
  })

  it('CLOSEDでは「答え表示」ボタンを表示する', () => {
    const wrapper = mountPanel(makeState({ event, questions: [{ ...pendingQuestion, status: 'CLOSED' }] }))
    expect(wrapper.find('.quiz-action-button').text()).toBe('答え表示')
  })

  it('REVEALEDで次問があれば「次の問題を公開」を表示する', () => {
    const wrapper = mountPanel(makeState({
      event,
      questions: [{ ...pendingQuestion, id: 1, position: 1, status: 'REVEALED' }, pendingQuestion],
    }))
    expect(wrapper.find('.quiz-action-button').text()).toBe('次の問題を公開')
  })

  it('FINISHEDでは操作を表示せず終了を案内する', () => {
    const wrapper = mountPanel(makeState({
      event: { ...event, status: 'FINISHED', finishedAt: '2026-09-07T12:10:00Z' },
      questions: [{ ...pendingQuestion, status: 'REVEALED' }],
    }))
    expect(wrapper.find('.quiz-action-button').exists()).toBe(false)
    expect(wrapper.find('.quiz-phase-done').text()).toContain('クイズ大会は終了しました')
  })

  it('ボタン押下で対応するemitが発火する', async () => {
    const wrapper = mountPanel(makeState({ event, questions: [{ ...pendingQuestion, status: 'PUBLISHED' }] }))
    await wrapper.find('.quiz-action-button').trigger('click')
    expect(wrapper.emitted('close')).toHaveLength(1)
  })
})
