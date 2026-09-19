import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import QuestionBulkDeleteDialog from '../../app/features/problems/components/QuestionBulkDeleteDialog.vue'
import { summarizeBulkDeleteImpact } from '../../app/features/problems/components/QuestionRow'
import { bulkDeleteQuestionsErrorMessage } from '../../app/features/problems/validation'
import type { Question } from '../../app/features/problems/types'

function makeQuestion(id: number, overrides: Partial<Question> = {}): Question {
  return {
    id, position: id, questionText: `問題${id}`,
    choiceA: 'A', choiceB: 'B', choiceC: 'C', choiceD: 'D',
    correctAnswer: 'A', imageUrl: null, explanation: null, targetAudience: null, points: 100,
    createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  }
}

describe('一括削除の影響集計', () => {
  it('出題中・公開済み・回答済みを数え、重複は1問として影響件数に入れる', () => {
    const impact = summarizeBulkDeleteImpact([
      makeQuestion(1),
      makeQuestion(2, { revealedAt: '2026-01-01T00:00:00.000Z', hasParticipantData: true }),
      makeQuestion(3, { isLiveQuestion: true }),
      makeQuestion(4, { hasParticipantData: true }),
    ])
    expect(impact).toEqual({ total: 4, live: 1, revealed: 1, answered: 2, affected: 3 })
  })
})

describe('一括削除確認ダイアログ', () => {
  it('影響がない場合は件数だけを示し、赤い警告は出さない', () => {
    const wrapper = mount(QuestionBulkDeleteDialog, {
      props: { questions: [makeQuestion(1), makeQuestion(2)], isDeleting: false, errorMessage: '' },
    })
    expect(wrapper.text()).toContain('選択した 2 問を削除します')
    expect(wrapper.find('.bulk-delete-warning').exists()).toBe(false)
    expect(wrapper.find('.delete-button').text()).toBe('2問を削除する')
  })

  it('出題済み・回答済み・出題中を含む場合は件数つきの警告を出す', () => {
    const wrapper = mount(QuestionBulkDeleteDialog, {
      props: {
        questions: [
          makeQuestion(1),
          makeQuestion(2, { revealedAt: '2026-01-01T00:00:00.000Z', hasParticipantData: true }),
          makeQuestion(3, { isLiveQuestion: true }),
        ],
        isDeleting: false,
        errorMessage: '',
      },
    })
    const warning = wrapper.find('.bulk-delete-warning')
    expect(warning.attributes('role')).toBe('alert')
    expect(warning.text()).toContain('3 問のうち 2 問')
    expect(warning.text()).toContain('出題中の問題: 1 問')
    expect(warning.text()).toContain('正解公開済みの問題: 1 問')
    expect(warning.text()).toContain('回答・自信度の記録がある問題: 1 問')
    expect(warning.text()).toContain('元に戻せません')
  })

  it('確認・キャンセルをemitし、削除中は両ボタンを無効化する', async () => {
    const wrapper = mount(QuestionBulkDeleteDialog, {
      props: { questions: [makeQuestion(1)], isDeleting: false, errorMessage: 'エラー' },
    })
    expect(wrapper.text()).toContain('エラー')
    await wrapper.find('.delete-button').trigger('click')
    await wrapper.find('.button-cancel').trigger('click')
    expect(wrapper.emitted('confirm')).toHaveLength(1)
    expect(wrapper.emitted('close')).toHaveLength(1)

    await wrapper.setProps({ isDeleting: true })
    expect(wrapper.find('.delete-button').attributes('disabled')).toBeDefined()
    expect(wrapper.find('.button-cancel').attributes('disabled')).toBeDefined()
  })
})

describe('一括削除エラーメッセージ', () => {
  it('404/422は専用文言、それ以外は共通メッセージにフォールバックする', () => {
    expect(bulkDeleteQuestionsErrorMessage(404, 'x')).toContain('見つかりませんでした')
    expect(bulkDeleteQuestionsErrorMessage(422, 'x')).toContain('正しくありません')
    expect(bulkDeleteQuestionsErrorMessage(500, 'fallback')).toBe('fallback')
  })
})
