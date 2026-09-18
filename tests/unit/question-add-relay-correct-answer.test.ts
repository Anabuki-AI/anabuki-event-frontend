import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import QuestionAdd from '../../app/features/problems/components/QuestionAddModal.vue'

async function fillRequiredFields(wrapper: ReturnType<typeof mount>) {
  const questionText = wrapper.findAll('textarea')[0]!
  await questionText.setValue('日本の首都はどこでしょう？')

  await wrapper.get('[aria-label="選択肢A"]').setValue('東京')
  await wrapper.get('[aria-label="選択肢B"]').setValue('大阪')
  await wrapper.get('[aria-label="選択肢C"]').setValue('京都')
  await wrapper.get('[aria-label="選択肢D"]').setValue('名古屋')
}

describe('問題追加フォーム: 中継問題の正解未選択保存', () => {
  it('通常問題は正解未選択のままだと保存できない', async () => {
    const wrapper = mount(QuestionAdd, { attachTo: document.body })
    await fillRequiredFields(wrapper)

    expect(wrapper.find('.question-add-save').attributes('disabled')).toBeDefined()

    wrapper.unmount()
  })

  it('中継問題として扱うにチェックすると、正解未選択でも保存できる', async () => {
    const wrapper = mount(QuestionAdd, { attachTo: document.body })
    await fillRequiredFields(wrapper)

    const relayCheckbox = wrapper.get('.question-add-checkbox-field input[type="checkbox"]')
    await relayCheckbox.setValue(true)

    expect(wrapper.find('.question-add-save').attributes('disabled')).toBeUndefined()
    // 正解のラジオボタンはどれも選択されていない
    const radios = wrapper.findAll('.question-add-correct-radio')
    expect(radios.some(radio => (radio.element as HTMLInputElement).checked)).toBe(false)

    wrapper.unmount()
  })

  it('中継問題のチェックを外すと再び正解選択が必須に戻る', async () => {
    const wrapper = mount(QuestionAdd, { attachTo: document.body })
    await fillRequiredFields(wrapper)

    const relayCheckbox = wrapper.get('.question-add-checkbox-field input[type="checkbox"]')
    await relayCheckbox.setValue(true)
    expect(wrapper.find('.question-add-save').attributes('disabled')).toBeUndefined()

    await relayCheckbox.setValue(false)
    expect(wrapper.find('.question-add-save').attributes('disabled')).toBeDefined()

    wrapper.unmount()
  })

  it('正解を選択済みなら、中継問題フラグに関わらず保存できる', async () => {
    const wrapper = mount(QuestionAdd, { attachTo: document.body })
    await fillRequiredFields(wrapper)

    await wrapper.get('.question-add-correct-radio[value="B"]').setValue()

    expect(wrapper.find('.question-add-save').attributes('disabled')).toBeUndefined()

    wrapper.unmount()
  })
})
