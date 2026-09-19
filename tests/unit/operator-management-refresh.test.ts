import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import ManagementPage from '../../app/pages/event_operator/management.vue'
import QuestionAddModal from '../../app/features/problems/components/QuestionAddModal.vue'
import QuestionEditModal from '../../app/features/problems/components/QuestionEditModal.vue'
import type { ConfidenceMultipliers, Question } from '../../app/features/problems/types'

vi.stubGlobal('useSeoMeta', vi.fn())

const apiMocks = vi.hoisted(() => ({
  fetchQuestions: vi.fn(),
  fetchConfidenceMultipliers: vi.fn(),
  createQuestion: vi.fn(),
  updateQuestion: vi.fn(),
  deleteQuestion: vi.fn(),
  bulkDeleteQuestions: vi.fn(),
  selectRelayQuestion: vi.fn(),
  resolveQuestionImageUrl: (url: string | null) => url,
}))
const { fetchQuestions, fetchConfidenceMultipliers, createQuestion, updateQuestion, deleteQuestion, bulkDeleteQuestions, selectRelayQuestion } = apiMocks

vi.mock('~/features/problems/api/client', () => apiMocks)

const NuxtLinkStub = {
  name: 'NuxtLink',
  props: { to: { type: String, required: true } },
  template: '<a :href="to"><slot /></a>',
}

const multipliers: ConfidenceMultipliers = { high: '2.00', normal: '1.00', low: '0.50' }

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
    isRelayQuestion: false,
    isSelectedRelayQuestion: false,
    points: 100,
    timeLimitSeconds: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  }
}

function mountManagement() {
  return mount(ManagementPage, {
    global: { stubs: { NuxtLink: NuxtLinkStub } },
  })
}

describe('問題管理の再取得と即時パッチ', () => {
  beforeEach(() => {
    fetchQuestions.mockReset()
    fetchConfidenceMultipliers.mockReset()
    createQuestion.mockReset()
    updateQuestion.mockReset()
    deleteQuestion.mockReset()
    selectRelayQuestion.mockReset()
    fetchConfidenceMultipliers.mockResolvedValue(multipliers)
  })

  it('初回だけ一覧をスケルトンにし、再取得中は既存一覧を保持する', async () => {
    const firstQuestion = makeQuestion()
    let resolveInitial!: (questions: Question[]) => void
    let resolveRefresh!: (questions: Question[]) => void
    fetchQuestions
      .mockReturnValueOnce(new Promise<Question[]>(resolve => { resolveInitial = resolve }))
      .mockReturnValueOnce(new Promise<Question[]>(resolve => { resolveRefresh = resolve }))

    const wrapper = mountManagement()
    expect(wrapper.find('.question-list-skeleton').exists()).toBe(true)

    resolveInitial([firstQuestion])
    await flushPromises()
    expect(wrapper.find('.question-text').text()).toBe('既存の問題文')

    await wrapper.find('.add-question-link').trigger('click')
    const savedQuestion = makeQuestion({ id: 2, position: 2, questionText: '追加された問題' })
    wrapper.findComponent(QuestionAddModal).vm.$emit('saved', savedQuestion)
    await wrapper.vm.$nextTick()

    expect(wrapper.find('.question-list-skeleton').exists()).toBe(false)
    expect(wrapper.text()).toContain('追加された問題')
    expect(wrapper.find('.question-refresh-status').text()).toContain('更新中')

    resolveRefresh([firstQuestion, savedQuestion])
    await flushPromises()
    expect(wrapper.find('.question-refresh-status').exists()).toBe(false)
    expect(wrapper.text()).toContain('追加された問題')
    wrapper.unmount()
  })

  it('saved(question) の追加はサーバー応答を一覧へ即時追加し、編集は同じIDを置換する', async () => {
    const original = makeQuestion()
    const added = makeQuestion({ id: 2, position: 2, questionText: '追加された問題' })
    const edited = makeQuestion({ questionText: 'サーバー値で更新された問題', points: 200 })
    fetchQuestions
      .mockResolvedValueOnce([original])
      .mockReturnValue(new Promise<Question[]>(() => {}))

    const wrapper = mountManagement()
    await flushPromises()

    await wrapper.find('.add-question-link').trigger('click')
    wrapper.findComponent(QuestionAddModal).vm.$emit('saved', added)
    await wrapper.vm.$nextTick()
    expect(wrapper.findAll('.question-row')).toHaveLength(2)
    expect(wrapper.text()).toContain('追加された問題')

    await wrapper.findAll('.row-action-link').filter(button => button.text() === '編集')[0]!.trigger('click')
    wrapper.findComponent(QuestionEditModal).vm.$emit('saved', edited)
    await wrapper.vm.$nextTick()

    expect(wrapper.findAll('.question-row')).toHaveLength(2)
    expect(wrapper.text()).toContain('サーバー値で更新された問題')
    expect(wrapper.text()).not.toContain('既存の問題文')
    wrapper.unmount()
  })

  it('再取得が失敗しても、確定済みのローカル追加を保持する', async () => {
    const original = makeQuestion()
    let rejectRefresh!: (error: unknown) => void
    fetchQuestions
      .mockResolvedValueOnce([original])
      .mockReturnValueOnce(new Promise<Question[]>((_resolve, reject) => { rejectRefresh = reject }))

    const wrapper = mountManagement()
    await flushPromises()

    await wrapper.find('.add-question-link').trigger('click')
    const added = makeQuestion({ id: 2, position: 2, questionText: '失敗後も残る問題' })
    wrapper.findComponent(QuestionAddModal).vm.$emit('saved', added)
    await wrapper.vm.$nextTick()
    rejectRefresh(new Error('refresh failed'))
    await flushPromises()

    expect(wrapper.text()).toContain('失敗後も残る問題')
    expect(wrapper.find('.question-refresh-status.is-error').exists()).toBe(true)
    wrapper.unmount()
  })
})

describe('問題管理の一括削除', () => {
  beforeEach(() => {
    fetchQuestions.mockReset()
    fetchConfidenceMultipliers.mockReset()
    bulkDeleteQuestions.mockReset()
    fetchConfidenceMultipliers.mockResolvedValue(multipliers)
  })

  const list = () => [
    makeQuestion({ id: 1, position: 1 }),
    makeQuestion({ id: 2, position: 2, revealedAt: '2026-01-01T00:00:00.000Z', hasParticipantData: true }),
    makeQuestion({ id: 3, position: 3 }),
  ]

  it('未選択の間は一括削除ボタンが無効で、選択すると有効になり件数が出る', async () => {
    fetchQuestions.mockResolvedValue(list())
    const wrapper = mountManagement()
    await flushPromises()

    const button = wrapper.find('.bulk-delete-button')
    expect(button.attributes('disabled')).toBeDefined()
    await wrapper.findAll('.question-select-checkbox')[0]!.setValue(true)
    expect(button.attributes('disabled')).toBeUndefined()
    expect(wrapper.find('.bulk-selected-count').text()).toContain('1 問を選択中')
  })

  it('すべて選択で全件を選び、もう一度で解除する', async () => {
    fetchQuestions.mockResolvedValue(list())
    const wrapper = mountManagement()
    await flushPromises()

    const selectAll = wrapper.find('.bulk-select-all input')
    await selectAll.setValue(true)
    expect(wrapper.find('.bulk-selected-count').text()).toContain('3 問を選択中')
    await selectAll.setValue(false)
    expect(wrapper.find('.bulk-selected-count').text()).toContain('0 問を選択中')
  })

  it('確認ダイアログで確認するまで削除せず、キャンセルでは削除しない', async () => {
    fetchQuestions.mockResolvedValue(list())
    const wrapper = mountManagement()
    await flushPromises()

    await wrapper.find('.bulk-select-all input').setValue(true)
    await wrapper.find('.bulk-delete-button').trigger('click')
    expect(bulkDeleteQuestions).not.toHaveBeenCalled()
    expect(wrapper.find('.bulk-delete-warning').text()).toContain('3 問のうち 1 問')

    await wrapper.find('.delete-dialog .button-cancel').trigger('click')
    expect(bulkDeleteQuestions).not.toHaveBeenCalled()
    expect(wrapper.find('.delete-dialog').exists()).toBe(false)
  })

  it('確認後に選択IDで削除し、一覧から除去して成功メッセージを出す', async () => {
    fetchQuestions.mockResolvedValueOnce(list()).mockResolvedValue([makeQuestion({ id: 3, position: 1 })])
    bulkDeleteQuestions.mockResolvedValue({ deletedCount: 2, deletedIds: [1, 2] })
    const wrapper = mountManagement()
    await flushPromises()

    const boxes = wrapper.findAll('.question-select-checkbox')
    await boxes[0]!.setValue(true)
    await boxes[1]!.setValue(true)
    await wrapper.find('.bulk-delete-button').trigger('click')
    await wrapper.find('.delete-dialog .delete-button').trigger('click')
    await flushPromises()

    expect(bulkDeleteQuestions).toHaveBeenCalledWith([1, 2])
    expect(wrapper.find('.delete-dialog').exists()).toBe(false)
    expect(wrapper.findAll('.question-row')).toHaveLength(1)
    expect(wrapper.text()).toContain('2問を削除しました。')
    expect(wrapper.find('.bulk-selected-count').text()).toContain('0 問を選択中')
  })

  it('失敗時はダイアログを開いたままエラーを表示し、選択を保持する', async () => {
    fetchQuestions.mockResolvedValue(list())
    bulkDeleteQuestions.mockRejectedValue(Object.assign(new Error('boom'), { statusCode: 500 }))
    const wrapper = mountManagement()
    await flushPromises()

    await wrapper.findAll('.question-select-checkbox')[0]!.setValue(true)
    await wrapper.find('.bulk-delete-button').trigger('click')
    await wrapper.find('.delete-dialog .delete-button').trigger('click')
    await flushPromises()

    expect(wrapper.find('.delete-dialog .status-message.error').exists()).toBe(true)
    expect(wrapper.findAll('.question-row')).toHaveLength(3)
    expect(wrapper.find('.bulk-selected-count').text()).toContain('1 問を選択中')
  })
})
