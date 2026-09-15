import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'
import QuestionForm from '../../app/features/problems/components/QuestionForm.vue'
import QuestionFormFields from '../../app/features/problems/components/QuestionFormFields.vue'
import type { Question } from '../../app/features/problems/types'

// ハードコードされたテストデータ（レビュー方針に合わせフィクスチャ分割はしない）
const editQuestion: Question = {
  id: 7,
  questionText: '日本の首都はどこでしょう？',
  choices: { A: '東京', B: '大阪', C: '札幌', D: '福岡' },
  correctAnswer: 'A',
}

function createTestRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/event_operator/problem-management', component: { template: '<div />' } },
      { path: '/', component: { template: '<div />' } },
    ],
  })
}

function mountForm(question?: Question) {
  const router = createTestRouter()
  router.push('/admin/problems/7/edit')
  const wrapper = mount(QuestionForm, {
    props: question == null ? {} : { question },
    global: {
      components: { QuestionFormFields },
      plugins: [router],
    },
  })
  return { wrapper, router }
}

describe('問題追加フォーム（new画面の要素）', () => {
  it('追加時は画像アップロードの仮UIを表示する', () => {
    const { wrapper } = mountForm()

    const upload = wrapper.find('.image-upload-field')
    expect(upload.exists()).toBe(true)
    expect(upload.find('input[type="file"]').attributes('disabled')).toBeDefined()
    expect(upload.text()).toContain('画像アップロードは準備中です')
  })

  it('追加フォームは保存ボタンとキャンセルボタンを持つ', () => {
    const { wrapper } = mountForm()

    expect(wrapper.find('button[type="submit"]').exists()).toBe(true)
    expect(wrapper.find('.button-cancel').text()).toBe('キャンセル')
  })

  it('必須項目が空のまま保存すると検証エラーが出て登録されない', async () => {
    const wrapper = mountForm().wrapper

    await wrapper.find('form').trigger('submit')

    expect(wrapper.findAll('.field-note.is-error').length).toBeGreaterThan(0)
    expect(wrapper.find('.status-message.success').exists()).toBe(false)
  })

  it('キャンセルボタンで問題一覧へ遷移する', async () => {
    const { wrapper, router } = mountForm()

    await wrapper.find('.button-cancel').trigger('click')
    await router.isReady()

    expect(router.currentRoute.value.path).toBe('/event_operator/problem-management')
  })
})

describe('問題編集フォーム（edit画面の要素）', () => {
  it('編集時は画像アップロードの仮UIを表示しない', () => {
    const { wrapper } = mountForm(editQuestion)

    expect(wrapper.find('.image-upload-field').exists()).toBe(false)
  })

  it('編集フォームは既存の問題文を表示し、保存・キャンセルボタンを持つ', () => {
    const { wrapper } = mountForm(editQuestion)

    expect((wrapper.find('textarea').element as HTMLTextAreaElement).value).toBe('日本の首都はどこでしょう？')
    expect(wrapper.find('button[type="submit"]').text()).toBe('保存する')
    expect(wrapper.find('.button-cancel').text()).toBe('キャンセル')
  })

  it('キャンセルボタンで問題一覧へ遷移する', async () => {
    const { wrapper, router } = mountForm(editQuestion)

    await wrapper.find('.button-cancel').trigger('click')
    await router.isReady()

    expect(router.currentRoute.value.path).toBe('/event_operator/problem-management')
  })
})
