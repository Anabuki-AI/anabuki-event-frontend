import { flushPromises, mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { request } from '~/lib/api/client'
import QuestionEdit from '../../app/features/problems/components/QuestionEditModal.vue'
import type { Question } from '../../app/features/problems/types'

vi.mock('~/lib/api/client', () => ({ request: vi.fn() }))

const mockedRequest = vi.mocked(request)

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

  it('選択が外れていても、既にライブ出題・正解公開済み(revealedAt設定済み)の中継問題は正解ラジオボタンを操作できる', async () => {
    const question = makeQuestion({
      isRelayQuestion: true,
      isSelectedRelayQuestion: false,
      revealedAt: '2026-09-18T10:00:00.000Z',
    })
    const wrapper = mount(QuestionEdit, { props: { question }, attachTo: document.body })

    expect(wrapper.find('.question-add-relay-lock-note').exists()).toBe(false)
    const choiceBRadio = wrapper.findAll('.question-add-correct-radio')[1]!
    expect(choiceBRadio.attributes('disabled')).toBeUndefined()

    await choiceBRadio.setValue(true)
    expect(choiceBRadio.element.checked).toBe(true)

    wrapper.unmount()
  })
})

describe('正解ロック違反の422エラー表示（問題編集フォーム）', () => {
  it('correctAnswerのfieldErrorを伴う422では、汎用メッセージではなく中継問題ロックの案内文を表示する', async () => {
    mockedRequest.mockReset()
    mockedRequest.mockRejectedValueOnce({
      statusCode: 422,
      data: {
        error: 'Correct answer cannot be changed for a relay question that is not selected',
        fieldErrors: { correctAnswer: 'cannot be changed for a relay question that is not selected' },
      },
    })

    // 選択済み(=クライアント側ではロックされていない)の中継問題で、保存時に
    // サーバー側の状態が変わっていた(他の中継問題が選択された等)ケースを模す。
    const question = makeQuestion({ isRelayQuestion: true, isSelectedRelayQuestion: true })
    const wrapper = mount(QuestionEdit, { props: { question }, attachTo: document.body })

    await wrapper.get('.question-add-save').trigger('click')
    await flushPromises()

    const message = wrapper.find('.question-add-form > .status-message.error')
    expect(message.exists()).toBe(true)
    expect(message.text()).toBe(
      'この問題は中継問題として「今回の出題」に選択されていないため、正解を変更できません。「問題管理」の一覧で選択してから変更してください。',
    )
    expect(message.text()).not.toContain('入力内容を確認してください')

    wrapper.unmount()
  })

  it('correctAnswer以外の422では、従来通り汎用メッセージを表示する', async () => {
    mockedRequest.mockReset()
    mockedRequest.mockRejectedValueOnce({
      statusCode: 422,
      data: {
        error: 'Question text is too long',
        fieldErrors: { questionText: 'is too long' },
      },
    })

    const wrapper = mount(QuestionEdit, { props: { question: makeQuestion() }, attachTo: document.body })

    await wrapper.get('.question-add-save').trigger('click')
    await flushPromises()

    const message = wrapper.find('.question-add-form > .status-message.error')
    expect(message.text()).toBe('入力内容を確認してください。')

    wrapper.unmount()
  })
})
