import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import QuestionEdit from '../../app/pages/event_operator/questione.vue'
import type { Question } from '../../app/features/problems/types'

function makeQuestion(overrides: Partial<Question> = {}): Question {
  return {
    id: 1,
    position: 1,
    questionText: '既存の問題文',
    choiceA: 'A',
    choiceB: 'B',
    choiceC: 'C',
    choiceD: 'D',
    correctAnswer: 'A',
    imageUrl: null,
    explanation: null,
    targetAudience: null,
    points: 100,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  }
}

describe('中継問題の正解編集ロック（問題編集フォーム）', () => {
  it('通常の問題(isRelayQuestionなし)は正解ラジオボタンを常に操作できる', async () => {
    const wrapper = mount(QuestionEdit, { props: { question: makeQuestion() }, attachTo: document.body })

    expect(wrapper.find('.question-add-relay-lock-note').exists()).toBe(false)
    const choiceBRadio = wrapper.findAll('.question-add-correct-radio')[1]!
    expect(choiceBRadio.attributes('disabled')).toBeUndefined()

    await choiceBRadio.setValue(true)
    expect(choiceBRadio.element.checked).toBe(true)

    wrapper.unmount()
  })

  it('選択されていない中継問題は正解ラジオボタンをロックし、注記を表示する', async () => {
    const question = makeQuestion({ isRelayQuestion: true, isSelectedRelayQuestion: false })
    const wrapper = mount(QuestionEdit, { props: { question }, attachTo: document.body })

    expect(wrapper.find('.question-add-relay-lock-note').exists()).toBe(true)
    const radios = wrapper.findAll('.question-add-correct-radio')
    radios.forEach(radio => expect(radio.attributes('disabled')).toBeDefined())

    const choiceBRadio = radios[1]!
    await choiceBRadio.trigger('change')
    expect(choiceBRadio.element.checked).toBe(false)

    wrapper.unmount()
  })

  it('今回の出題として選択済みの中継問題は正解ラジオボタンを操作できる', async () => {
    const question = makeQuestion({ isRelayQuestion: true, isSelectedRelayQuestion: true })
    const wrapper = mount(QuestionEdit, { props: { question }, attachTo: document.body })

    expect(wrapper.find('.question-add-relay-lock-note').exists()).toBe(false)
    const choiceBRadio = wrapper.findAll('.question-add-correct-radio')[1]!
    expect(choiceBRadio.attributes('disabled')).toBeUndefined()

    await choiceBRadio.setValue(true)
    expect(choiceBRadio.element.checked).toBe(true)

    wrapper.unmount()
  })
})
