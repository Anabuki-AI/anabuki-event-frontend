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
  selectRelayQuestion: vi.fn(),
  resolveQuestionImageUrl: (url: string | null) => url,
}))
const { fetchQuestions, fetchConfidenceMultipliers, createQuestion, updateQuestion, deleteQuestion, selectRelayQuestion } = apiMocks

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
