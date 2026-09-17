import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import QuizTimerPanel from '../../app/features/quiz-control/components/QuizTimerPanel.vue'

function mountPanel(overrides: Partial<{
  phase: 'IDLE' | 'PUBLISHED' | 'CLOSED' | 'REVEALED' | 'FINISHED' | null
  phaseStartedAt: string | null
  finishedElapsedSeconds: number | null
  timeLimitSeconds: number | null
  questionId: number | null
  now: Date
  isActing: boolean
}> = {}) {
  return mount(QuizTimerPanel, {
    props: {
      phase: 'PUBLISHED',
      phaseStartedAt: '2026-09-07T12:00:00Z',
      finishedElapsedSeconds: null,
      timeLimitSeconds: 10,
      questionId: 1,
      now: new Date('2026-09-07T12:00:00Z'),
      ...overrides,
    },
  })
}

describe('QuizTimerPanel', () => {
  it('経過時間を常に表示する', () => {
    const wrapper = mountPanel({ now: new Date('2026-09-07T12:00:07Z') })
    expect(wrapper.find('.quiz-timer-elapsed').text()).toBe('00:07')
  })

  it('終了後はサーバーが固定した経過時間を時計更新後も表示する', async () => {
    const wrapper = mountPanel({
      phase: 'FINISHED',
      phaseStartedAt: '2026-09-07T12:00:07Z',
      finishedElapsedSeconds: 7,
      timeLimitSeconds: null,
      questionId: null,
      now: new Date('2026-09-07T12:00:07Z'),
    })
    expect(wrapper.find('.quiz-timer-elapsed').text()).toBe('00:07')

    await wrapper.setProps({ now: new Date('2026-09-07T12:10:00Z') })
    expect(wrapper.find('.quiz-timer-elapsed').text()).toBe('00:07')
  })

  it('終了済みなのに固定値がない場合は 00:00 にリセットせず未取得表示にする', () => {
    const wrapper = mountPanel({ phase: 'FINISHED', finishedElapsedSeconds: null })
    expect(wrapper.find('.quiz-timer-elapsed').text()).toBe('--:--')
  })

  it('制限時間がある場合は残り時間をカウントダウン表示する', () => {
    const wrapper = mountPanel({ timeLimitSeconds: 30, now: new Date('2026-09-07T12:00:05Z') })
    expect(wrapper.find('.quiz-timer-remaining').text()).toBe('00:25')
    expect(wrapper.find('.quiz-timer-countdown').classes()).toContain('is-normal')
  })

  it('制限時間がない場合は「制限時間なし」を表示する', () => {
    const wrapper = mountPanel({ timeLimitSeconds: null })
    expect(wrapper.find('.quiz-timer-no-limit').text()).toBe('制限時間なし')
    expect(wrapper.find('.quiz-timer-remaining').exists()).toBe(false)
  })

  it('残り割合が少なくなると warning 状態になる', () => {
    const wrapper = mountPanel({ timeLimitSeconds: 30, now: new Date('2026-09-07T12:00:24Z') })
    expect(wrapper.find('.quiz-timer-countdown').classes()).toContain('is-warning')
  })

  it('残り時間が0になった瞬間に一度だけ expire を emit する(多重発火防止)', async () => {
    const wrapper = mountPanel({ timeLimitSeconds: 10, now: new Date('2026-09-07T12:00:05Z') })
    expect(wrapper.emitted('expire')).toBeUndefined()

    await wrapper.setProps({ now: new Date('2026-09-07T12:00:10Z') })
    expect(wrapper.emitted('expire')).toHaveLength(1)
    expect(wrapper.find('.quiz-timer-countdown').classes()).toContain('is-expired')

    // 0のまま時間が進んでも(ポーリング等で同じ状態が何度も評価されても)再発火しない
    await wrapper.setProps({ now: new Date('2026-09-07T12:00:12Z') })
    await wrapper.setProps({ now: new Date('2026-09-07T12:00:15Z') })
    expect(wrapper.emitted('expire')).toHaveLength(1)
  })

  it('PUBLISHED以外のフェーズでは期限切れでも expire を emit しない', async () => {
    const wrapper = mountPanel({ phase: 'CLOSED', timeLimitSeconds: 10, now: new Date('2026-09-07T12:00:05Z') })
    await wrapper.setProps({ now: new Date('2026-09-07T12:00:10Z') })
    expect(wrapper.emitted('expire')).toBeUndefined()
  })

  it('進行操作中に期限が切れても、操作完了後に一度だけ自動締め切りする', async () => {
    const wrapper = mountPanel({ isActing: true, now: new Date('2026-09-07T12:00:10Z') })
    expect(wrapper.emitted('expire')).toBeUndefined()

    await wrapper.setProps({ isActing: false })
    expect(wrapper.emitted('expire')).toHaveLength(1)

    await wrapper.setProps({ now: new Date('2026-09-07T12:00:11Z') })
    expect(wrapper.emitted('expire')).toHaveLength(1)
  })

  it('手動締め切りが完了した場合は自動締め切りを送らない', async () => {
    const wrapper = mountPanel({ isActing: true, now: new Date('2026-09-07T12:00:10Z') })
    await wrapper.setProps({ isActing: false, phase: 'CLOSED' })
    expect(wrapper.emitted('expire')).toBeUndefined()
  })

  it('制限時間が設定されていない問題では expire を emit しない', async () => {
    const wrapper = mountPanel({ timeLimitSeconds: null, now: new Date('2026-09-07T12:00:05Z') })
    await wrapper.setProps({ now: new Date('2026-09-07T13:00:00Z') })
    expect(wrapper.emitted('expire')).toBeUndefined()
  })

  it('次の問題(questionIdの変化)に進むと、新しい制限時間で再び1回だけ発火できる', async () => {
    const wrapper = mountPanel({ timeLimitSeconds: 10, now: new Date('2026-09-07T12:00:10Z') })
    expect(wrapper.emitted('expire')).toHaveLength(1)

    await wrapper.setProps({
      questionId: 2,
      phaseStartedAt: '2026-09-07T13:00:00Z',
      now: new Date('2026-09-07T13:00:10Z'),
    })
    expect(wrapper.emitted('expire')).toHaveLength(2)
  })
})
