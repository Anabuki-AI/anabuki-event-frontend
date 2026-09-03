import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import AdminMenu from '../../app/features/admin/components/AdminMenu.vue'

const items = [
  {
    to: '/admin/voting-rate',
    icon: '📊',
    label: '投票率ページ',
    description: '問題ごとの解答状況と選択肢ごとの投票率を確認できます。',
  },
  {
    to: '/admin/quiz-control',
    icon: '🎮',
    label: '出題管理',
    description: 'クイズの出題を開始・進行できます。',
  },
  {
    to: '/admin/problems',
    icon: '📝',
    label: '問題管理',
    description: '問題の追加・編集などを行えます。',
  },
]

const NuxtLinkStub = {
  name: 'NuxtLink',
  props: ['to'],
  template: '<a :href="to"><slot /></a>',
}

function mountMenu() {
  return mount(AdminMenu, {
    props: { items },
    global: {
      stubs: { NuxtLink: NuxtLinkStub },
    },
  })
}

describe('AdminMenu', () => {
  it('各管理機能へのリンクをパス付きで表示する', () => {
    const wrapper = mountMenu()

    const links = wrapper.findAll('a.admin-menu-item')
    expect(links).toHaveLength(3)
    expect(links.map(link => link.attributes('href'))).toEqual([
      '/admin/voting-rate',
      '/admin/quiz-control',
      '/admin/problems',
    ])
  })

  it('各リンクにラベルを表示する', () => {
    const wrapper = mountMenu()

    const labels = wrapper.findAll('.admin-menu-label')
    expect(labels.map(label => label.text())).toEqual([
      '投票率ページ',
      '出題管理',
      '問題管理',
    ])
  })

  it('ナビゲーションにラベルが付いている', () => {
    const wrapper = mountMenu()

    expect(wrapper.find('nav').attributes('aria-label')).toBe('管理機能メニュー')
  })
})
