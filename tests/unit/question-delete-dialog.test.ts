import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import QuestionDeleteDialog from '../../app/features/problems/components/QuestionDeleteDialog.vue'
import type { Question } from '../../app/features/problems/types'

const question: Question = {
  id: 9,
  position: 4,
  questionText: '削除対象の問題',
  choiceA: 'A', choiceB: 'B', choiceC: 'C', choiceD: 'D',
  correctAnswer: 'A', imageUrl: null,
  explanation: null, targetAudience: null, points: 100,
  createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z',
}

describe('問題削除確認ダイアログ', () => {
  it('問題位置を読み上げ可能な確認文に表示し、確認操作をemitする', async () => {
    const wrapper = mount(QuestionDeleteDialog, { props: { question, isDeleting: false, errorMessage: '' } })
    expect(wrapper.attributes('role')).toBeUndefined()
    expect(wrapper.text()).toContain('Q4')
    await wrapper.find('.delete-button').trigger('click')
    expect(wrapper.emitted('confirm')).toHaveLength(1)
  })

  it('削除中はキャンセルと削除を無効化する', () => {
    const wrapper = mount(QuestionDeleteDialog, { props: { question, isDeleting: true, errorMessage: '' } })
    expect(wrapper.find('.button-cancel').attributes('disabled')).toBeDefined()
    expect(wrapper.find('.delete-button').attributes('disabled')).toBeDefined()
  })
})
