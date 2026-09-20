import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import QuestionPreviewModal from '../../app/features/problems/components/QuestionPreviewModal.vue'
import type { Question } from '../../app/features/problems/types'

const question = {
  id: 1,
  position: 1,
  questionText: '問題文',
  choiceA: 'a',
  choiceB: 'b',
  choiceC: 'c',
  choiceD: 'd',
  correctAnswer: 'A',
  imageUrl: null,
  explanation: null,
  targetAudience: null,
  points: 100,
} as unknown as Question

describe('問題プレビューモーダルの自信度表示', () => {
  it('解答画面と同じ なし/普通/あり 表記と倍率を表示し、Lv.表記は出さない', () => {
    const wrapper = mount(QuestionPreviewModal, { props: { question } })
    const names = wrapper.findAll('.confidence-name').map(n => n.text())
    const rates = wrapper.findAll('.confidence-rate').map(n => n.text())
    expect(names).toEqual(['なし', '普通', 'あり'])
    expect(rates).toEqual(['×0.5', '×1.0', '×2.0'])
    expect(wrapper.text()).not.toContain('Lv.')
    expect(wrapper.text()).toContain('自信度：普通')
    wrapper.unmount()
  })

  it('選択した自信度がラベルで反映される', async () => {
    const wrapper = mount(QuestionPreviewModal, { props: { question } })
    await wrapper.findAll('.confidence-item')[2]!.trigger('click')
    expect(wrapper.text()).toContain('自信度：あり')
    wrapper.unmount()
  })
})
