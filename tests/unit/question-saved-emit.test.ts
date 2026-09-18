import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import QuestionAddModal from '../../app/features/problems/components/QuestionAddModal.vue'
import QuestionEditModal from '../../app/features/problems/components/QuestionEditModal.vue'
import type { Question } from '../../app/features/problems/types'
import { request } from '~/lib/api/client'

vi.mock('~/lib/api/client', () => ({ request: vi.fn() }))

const mockedRequest = vi.mocked(request)

const savedQuestion: Question = {
  id: 7,
  position: 3,
  questionText: 'サーバーが返した問題',
  choiceA: 'A',
  choiceB: 'B',
  choiceC: 'C',
  choiceD: 'D',
  correctAnswer: 'B',
  imageUrl: null,
  explanation: 'サーバーの解説',
  targetAudience: '1年生',
  isRelayQuestion: false,
  isSelectedRelayQuestion: false,
  points: 200,
  timeLimitSeconds: 30,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-02T00:00:00.000Z',
}

const editQuestion: Question = {
  ...savedQuestion,
  id: 7,
  questionText: '編集前の問題',
  correctAnswer: 'A',
}

async function fillAddForm(wrapper: ReturnType<typeof mount>) {
  await wrapper.findAll('textarea')[0]!.setValue('問題文')
  await wrapper.get('[aria-label="選択肢A"]').setValue('A')
  await wrapper.get('[aria-label="選択肢B"]').setValue('B')
  await wrapper.get('[aria-label="選択肢C"]').setValue('C')
  await wrapper.get('[aria-label="選択肢D"]').setValue('D')
  await wrapper.get('.question-add-correct-radio[value="B"]').setValue()
}

describe('問題保存の応答イベント', () => {
  beforeEach(() => mockedRequest.mockReset())

  it('問題追加はAPI応答のQuestionをsaved emitへ渡す', async () => {
    mockedRequest.mockResolvedValue(savedQuestion)
    const wrapper = mount(QuestionAddModal)
    await fillAddForm(wrapper)
    await wrapper.get('.question-add-save').trigger('click')
    await flushPromises()

    expect(wrapper.emitted('saved')).toEqual([[savedQuestion]])
    wrapper.unmount()
  })

  it('問題編集はAPI応答のQuestionをsaved emitへ渡す', async () => {
    mockedRequest.mockResolvedValue(savedQuestion)
    const wrapper = mount(QuestionEditModal, { props: { question: editQuestion } })
    await wrapper.get('.question-add-save').trigger('click')
    await flushPromises()

    expect(wrapper.emitted('saved')).toEqual([[savedQuestion]])
    wrapper.unmount()
  })
})
