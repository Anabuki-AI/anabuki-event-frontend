import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import MyRankingPanel from '../../app/features/rankings/components/MyRankingPanel.vue'

describe('MyRankingPanel', () => {
  it('renders the entry in the miro spec format: rank + あなたは + points', () => {
    const wrapper = mount(MyRankingPanel, {
      props: {
        entry: { rank: 256, userName: 'alice', points: 0 },
      },
    })

    expect(wrapper.find('.my-ranking-line').text()).toBe('256位 あなたは 0ポイント')
    expect(wrapper.attributes('aria-busy')).toBe('false')
  })

  it('formats large points with locale separators', () => {
    const wrapper = mount(MyRankingPanel, {
      props: {
        entry: { rank: 42, userName: 'alice', points: 12345 },
      },
    })

    expect(wrapper.text()).toContain('42位 あなたは 12,345ポイント')
  })

  it('shows the loading message instead of an empty panel while fetching', () => {
    const wrapper = mount(MyRankingPanel, {
      props: {
        entry: null,
        loading: true,
      },
    })

    expect(wrapper.text()).toContain('順位を確認しています…')
    expect(wrapper.find('.status-message').exists()).toBe(false)
    expect(wrapper.attributes('aria-busy')).toBe('true')
  })

  it('shows the error message with role="alert"', () => {
    const wrapper = mount(MyRankingPanel, {
      props: {
        entry: null,
        errorMessage: '通信に失敗しました。',
      },
    })

    const alert = wrapper.find('.status-message.error')
    expect(alert.exists()).toBe(true)
    expect(alert.attributes('role')).toBe('alert')
    expect(alert.text()).toBe('通信に失敗しました。')
  })
})
