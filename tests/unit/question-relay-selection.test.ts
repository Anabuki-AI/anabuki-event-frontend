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
  it('通常問題を中継問題へ切り替えると、以前の正解を未選択に戻す', async () => {
    const question = makeQuestion({ correctAnswer: 'C' })
    mockedRequest.mockResolvedValueOnce({ ...question, correctAnswer: 'A', isRelayQuestion: true })
    const wrapper = mount(QuestionEdit, { props: { question }, attachTo: document.body })

    const relayCheckbox = wrapper.get('.question-add-checkbox-field input[type="checkbox"]')
    await relayCheckbox.setValue(true)

    const radios = wrapper.findAll('.question-add-correct-radio')
    radios.forEach(radio => expect(radio.element.checked).toBe(false))

    await wrapper.get('.question-add-save').trigger('click')
    const body = mockedRequest.mock.calls[0]?.[1]?.body as FormData
    expect(body.get('correctAnswer')).toBe('A')

    wrapper.unmount()
  })

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

  it('選択済み・出題済みでも、現在ライブ進行画面で出題中(isLiveQuestion)の中継問題は正解ラジオボタンをロックし、ライブ中の注記を表示する', async () => {
    // 「今回の出題」として選択されている(＝一覧上は選択中バッジ)だけでは、実際に
    // ライブ進行画面へ進んでいるとは限らない。isLiveQuestion はその独立した状態を
    // 表し、true の間は選択状態やrevealedAtに関わらず保存時に必ず拒否されるため、
    // 保存を試す前からロック・案内表示する必要がある(このテストが検証する対象)。
    const question = makeQuestion({
      isRelayQuestion: true,
      isSelectedRelayQuestion: true,
      revealedAt: '2026-09-18T10:00:00.000Z',
      isLiveQuestion: true,
    })
    const wrapper = mount(QuestionEdit, { props: { question }, attachTo: document.body })

    const note = wrapper.find('.question-add-relay-lock-note')
    expect(note.exists()).toBe(true)
    expect(note.text()).toBe(
      'この問題は現在ライブ進行画面で出題中(または直前に出題済み)のため、正解を変更できません。「出題管理」で次の問題に進んでから変更してください。',
    )
    const radios = wrapper.findAll('.question-add-correct-radio')
    radios.forEach(radio => expect(radio.attributes('disabled')).toBeDefined())

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

  it('選択済み・出題済みの中継問題でも、ライブ出題中(protect_live_question)を理由にcorrectAnswerのfieldErrorが返る場合は、中継ロック案内ではなくライブ出題中の案内を表示する', async () => {
    mockedRequest.mockReset()
    mockedRequest.mockRejectedValueOnce({
      statusCode: 422,
      data: {
        error: 'Correct answer cannot be changed while this question is live',
        fieldErrors: { correctAnswer: 'cannot be changed while this question is live' },
      },
    })

    // 運営者から見て「今回の出題として選択」済み・出題済み(revealedAt設定済み)
    // なので isCorrectAnswerLocked はクライアント側では false になり、正解ラジオは
    // 操作可能に見える。しかしライブ進行画面でまだ「次の問題」に進んでおらず、
    // quiz_sessions.current_question_id がこの問題を指したままのため、
    // backend の protect_live_question が correct_answer の変更を拒否するケース。
    // これは中継問題の選択ロックとは無関係な理由なので、その案内文を出してはいけない。
    const question = makeQuestion({
      isRelayQuestion: true,
      isSelectedRelayQuestion: true,
      revealedAt: '2026-09-18T10:00:00.000Z',
    })
    const wrapper = mount(QuestionEdit, { props: { question }, attachTo: document.body })

    await wrapper.get('.question-add-save').trigger('click')
    await flushPromises()

    const message = wrapper.find('.question-add-form > .status-message.error')
    expect(message.exists()).toBe(true)
    expect(message.text()).toBe(
      'この問題は現在ライブ進行画面で出題中(または直前に出題済み)のため、正解を変更できません。「出題管理」で次の問題に進んでから変更してください。',
    )
    expect(message.text()).not.toContain('今回の出題」に選択されていないため')
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
