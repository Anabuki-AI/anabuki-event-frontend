import { mount, flushPromises } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'

vi.mock('~/lib/api/client', () => ({ request: vi.fn() }))

import { request } from '~/lib/api/client'
import { toApiError } from '~/lib/api/error'
import { mapQuestionFieldErrors } from '~/features/problems/validation'
import QuestionForm from '../../app/features/problems/components/QuestionForm.vue'
import QuestionFormFields from '../../app/features/problems/components/QuestionFormFields.vue'
import type { Question } from '../../app/features/problems/types'

const mockedRequest = vi.mocked(request)
const editQuestion: Question = {
  id: 7,
  position: 2,
  questionText: '日本の首都はどこでしょう？',
  choiceA: '東京',
  choiceB: '大阪',
  choiceC: '札幌',
  choiceD: '福岡',
  correctAnswer: 'A',
  imageUrl: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
}

function createTestRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/admin/problems', component: { template: '<div />' } },
      { path: '/admin/problems/new', component: { template: '<div />' } },
      { path: '/admin/problems/7/edit', component: { template: '<div />' } },
    ],
  })
}

function mountForm(question?: Question) {
  const router = createTestRouter()
  router.push(question ? '/admin/problems/7/edit' : '/admin/problems/new')
  const wrapper = mount(QuestionForm, {
    props: question == null ? {} : { question },
    global: { plugins: [router] },
  })
  return { wrapper, router }
}

beforeEach(() => mockedRequest.mockReset())

describe('問題追加フォーム', () => {
  it('画像アップロードの未実装UIを表示しない', () => {
    const { wrapper } = mountForm()
    expect(wrapper.find('.image-upload-field').exists()).toBe(false)
  })

  it('必須項目が空のまま保存すると検証エラーが出て登録されない', async () => {
    const { wrapper } = mountForm()
    await wrapper.find('form').trigger('submit')
    expect(wrapper.findAll('.field-note.is-error').length).toBeGreaterThan(0)
    expect(mockedRequest).not.toHaveBeenCalled()
  })

  it('登録成功後に問題一覧へ遷移する', async () => {
    mockedRequest.mockResolvedValue(editQuestion)
    const { wrapper, router } = mountForm()
    const textarea = wrapper.find('textarea')
    await textarea.setValue('登録する問題')
    const inputs = wrapper.findAll('input[type="text"]')
    for (const [index, value] of ['A', 'B', 'C', 'D'].entries()) await inputs[index]?.setValue(value)

    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(mockedRequest).toHaveBeenCalledWith('/admin/questions', expect.objectContaining({ method: 'POST', credentials: 'include' }))
    expect(router.currentRoute.value.path).toBe('/admin/problems')
  })

  it('実API形式の文字列fieldErrorsを完全なメッセージとして表示する', () => {
    const apiError = toApiError({
      data: {
        error: 'Validation failed',
        fieldErrors: { questionText: '問題文を入力してください' },
      },
      statusCode: 422,
    })
    const wrapper = mount(QuestionFormFields, {
      props: {
        form: {
          questionText: '登録する問題',
          choices: { A: 'A', B: 'B', C: 'C', D: 'D' },
          correctAnswer: 'A',
        },
        fieldErrors: mapQuestionFieldErrors(apiError.fieldErrors),
        showFieldErrors: true,
      },
    })

    expect(wrapper.find('.field-note.is-error').text()).toBe('問題文を入力してください')
  })

  it('キャンセルボタンで問題一覧へ遷移する', async () => {
    const { wrapper, router } = mountForm()
    await wrapper.find('.button-cancel').trigger('click')
    await router.isReady()
    expect(router.currentRoute.value.path).toBe('/admin/problems')
  })
})

describe('問題編集フォーム', () => {
  it('既存値を表示し、更新成功後に一覧へ遷移する', async () => {
    mockedRequest.mockResolvedValue(editQuestion)
    const { wrapper, router } = mountForm(editQuestion)
    expect((wrapper.find('textarea').element as HTMLTextAreaElement).value).toBe('日本の首都はどこでしょう？')

    await wrapper.find('textarea').setValue('更新後の問題文')
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(mockedRequest).toHaveBeenCalledWith('/admin/questions/7', expect.objectContaining({ method: 'PUT', credentials: 'include' }))
    expect(router.currentRoute.value.path).toBe('/admin/problems')
  })
})
