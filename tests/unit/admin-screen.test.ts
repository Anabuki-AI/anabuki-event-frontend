import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import AdminScreen from '../../app/pages/admin/index.vue'

vi.stubGlobal('useSeoMeta', vi.fn())

const NuxtLinkStub = {
  name: 'NuxtLink',
  props: {
    to: { type: String, required: true },
  },
  template: '<a :href="to"><slot /></a>',
}

const mountAdminScreen = () =>
  mount(AdminScreen, {
    global: {
      stubs: {
        NuxtLink: NuxtLinkStub,
      },
    },
  })

describe('運営者メイン画面', () => {
  it('h1として「運営者メイン画面」を表示する', () => {
    const wrapper = mountAdminScreen()

    expect(wrapper.find('h1').text()).toBe('運営者メイン画面')
  })

  it('eyebrowに「Admin」を表示する', () => {
    const wrapper = mountAdminScreen()

    expect(wrapper.find('.eyebrow').text()).toBe('Admin')
  })

  it('説明文を表示する（タイポなし・1個の句点）', () => {
    const wrapper = mountAdminScreen()

    expect(wrapper.find('.muted-copy').text()).toBe('各管理機能へ移動して、クイズイベントの運営を行えます。')
    expect(wrapper.text()).not.toContain('行えます。。')
  })

  it('投票率ページへのリンクが /event_operator/voting-rate へ遷移する', () => {
    const wrapper = mountAdminScreen()

    const link = wrapper.findAll('a').find((a) => a.text().includes('投票率ページ'))
    expect(link).toBeDefined()
    expect(link!.attributes('href')).toBe('/event_operator/voting-rate')
  })

  it('投票率ページの説明文を表示する', () => {
    const wrapper = mountAdminScreen()

    const link = wrapper.findAll('a').find((a) => a.text().includes('投票率ページ'))
    expect(link!.text()).toContain('問題ごとの解答状況と選択肢ごとの投票率を確認できます。')
  })

  it('出題管理へのリンクが /admin/quiz-control へ遷移する', () => {
    const wrapper = mountAdminScreen()

    const link = wrapper.findAll('a').find((a) => a.text().includes('出題管理'))
    expect(link).toBeDefined()
    expect(link!.attributes('href')).toBe('/admin/quiz-control')
  })

  it('出題管理の説明文を表示する', () => {
    const wrapper = mountAdminScreen()

    const link = wrapper.findAll('a').find((a) => a.text().includes('出題管理'))
    expect(link!.text()).toContain('クイズの出題を開始・進行できます。')
  })

  it('問題管理へのリンクが /admin/problems へ遷移する', () => {
    const wrapper = mountAdminScreen()

    const link = wrapper.findAll('a').find((a) => a.text().includes('問題管理'))
    expect(link).toBeDefined()
    expect(link!.attributes('href')).toBe('/admin/problems')
  })

  it('問題管理の説明文を表示する', () => {
    const wrapper = mountAdminScreen()

    const link = wrapper.findAll('a').find((a) => a.text().includes('問題管理'))
    expect(link!.text()).toContain('問題の追加・編集などを行えます。')
  })

  it('ホームへ戻るリンクは表示しない', () => {
    const wrapper = mountAdminScreen()

    const backLinks = wrapper.findAll('a').filter((a) => a.text().includes('ホームへ戻る'))
    expect(backLinks).toHaveLength(0)
  })

  it('管理機能へのリンクは3件表示する', () => {
    const wrapper = mountAdminScreen()

    expect(wrapper.findAll('a.admin-menu-item')).toHaveLength(3)
  })
})
