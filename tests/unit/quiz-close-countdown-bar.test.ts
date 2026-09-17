import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import QuizCloseCountdownBar from '../../app/components/QuizCloseCountdownBar.vue'

describe('QuizCloseCountdownBar', () => {
  it('closing の間だけ上部バーとサーバー時刻基準のカウントダウンを表示する', () => {
    const wrapper = mount(QuizCloseCountdownBar, {
      props: {
        phase: 'closing',
        phaseStartedAt: '2026-09-20T10:00:00Z',
        now: new Date('2026-09-20T10:00:03Z'),
      },
    })

    expect(wrapper.text()).toContain('解答締め切りまで')
    expect(wrapper.text()).toContain('あと 00:07')
    expect(wrapper.find('.quiz-close-countdown__progress').attributes('style')).toContain('width: 70%')
  })

  it('answering・closed ではバーを表示しない', () => {
    const wrapper = mount(QuizCloseCountdownBar, {
      props: {
        phase: 'answering',
        phaseStartedAt: '2026-09-20T10:00:00Z',
        now: new Date('2026-09-20T10:00:03Z'),
      },
    })

    expect(wrapper.find('.quiz-close-countdown').exists()).toBe(false)
  })
})
