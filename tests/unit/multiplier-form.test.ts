import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'
import MultiplierForm from '../../app/features/problems/components/MultiplierForm.vue'
import type { Question } from '../../app/features/problems/types'

const question: Question = {
  id: 7,
  questionText: '日本の首都はどこでしょう？',
  choices: { A: '東京', B: '大阪', C: '札幌', D: '福岡' },
  correctAnswer: 'A',
  confidenceMultiplier: '1.50',
}

function createTestRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/admin/problems', component: { template: '<div />' } },
      { path: '/', component: { template: '<div />' } },
    ],
  })
}

function mountForm() {
  const router = createTestRouter()
  router.push('/admin/problems/7/multiplier')
  const wrapper = mount(MultiplierForm, {
    props: { question },
    global: {
      plugins: [router],
    },
  })
  return { wrapper, router }
}

describe('自信度倍率変更フォーム（multiplier画面の要素）', () => {
  it('対象の問題文と現在の倍率を表示する', () => {
    const wrapper = mountForm().wrapper

    const summary = wrapper.find('.multiplier-summary')
    expect(summary.text()).toContain('日本の首都はどこでしょう？')
    expect(summary.text()).toContain('×1.50')
  })

  it('変更を保存ボタンとキャンセルボタンを持つ', () => {
    const wrapper = mountForm().wrapper

    expect(wrapper.find('button[type="submit"]').text()).toBe('変更を保存')
    expect(wrapper.find('.button-cancel').text()).toBe('キャンセル')
  })

  it('キャンセルボタンで問題一覧へ遷移する', async () => {
    const { wrapper, router } = mountForm()

    await wrapper.find('.button-cancel').trigger('click')
    await router.isReady()

    expect(router.currentRoute.value.path).toBe('/admin/problems')
  })
})
