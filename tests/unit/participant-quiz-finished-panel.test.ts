import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import ParticipantQuizFinishedPanel from '~/features/participant-quiz/components/ParticipantQuizFinishedPanel.vue'

describe('ParticipantQuizFinishedPanel', () => {
  it('大会終了を案内し、正解画面への遷移を促さない', () => {
    const wrapper = mount(ParticipantQuizFinishedPanel)

    expect(wrapper.text()).toContain('クイズ大会は終了しました')
    expect(wrapper.text()).toContain('ご参加ありがとうございました')
    expect(wrapper.find('a').exists()).toBe(false)
  })
})
