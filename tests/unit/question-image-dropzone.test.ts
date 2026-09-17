import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import QuestionAdd from '../../app/pages/event_operator/question-add.vue'
import QuestionEdit from '../../app/pages/event_operator/questione.vue'
import type { Question } from '../../app/features/problems/types'

const question: Question = {
  id: 1,
  position: 1,
  questionText: '既存の問題文',
  choiceA: 'A', choiceB: 'B', choiceC: 'C', choiceD: 'D',
  correctAnswer: 'A', imageUrl: null,
  explanation: null, targetAudience: null,
  createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z',
}

function makeImageFile(): File {
  return new File(['dummy'], 'photo.webp', { type: 'image/webp' })
}

describe('問題画像のドラッグ&ドロップ', () => {
  it('新規追加フォーム: ドロップした画像をプレビュー表示する', async () => {
    const wrapper = mount(QuestionAdd, { attachTo: document.body })
    const dropzone = wrapper.find('.question-add-dropzone')

    await dropzone.trigger('dragenter', { dataTransfer: { files: [] } })
    expect(dropzone.classes()).toContain('is-dragover')

    await dropzone.trigger('drop', { dataTransfer: { files: [makeImageFile()] } })
    expect(dropzone.classes()).not.toContain('is-dragover')
    expect(wrapper.find('.question-add-image-preview img').exists()).toBe(true)

    wrapper.unmount()
  })

  it('編集フォーム: ドロップした画像をプレビュー表示する', async () => {
    const wrapper = mount(QuestionEdit, { props: { question }, attachTo: document.body })
    const dropzone = wrapper.find('.question-add-dropzone')

    await dropzone.trigger('drop', { dataTransfer: { files: [makeImageFile()] } })
    expect(wrapper.find('.question-add-image-preview img').exists()).toBe(true)

    wrapper.unmount()
  })
})
