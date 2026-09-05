import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import QuestionRow from '../../app/features/problems/components/QuestionRow.vue'
import type { Question } from '../../app/features/problems/types'

const question: Question = {
  id: 3,
  questionText: '日本の首都はどこでしょう?',
  choices: { A: '東京', B: '大阪', C: '札幌', D: '福岡' },
  correctAnswer: 'A',
  confidenceMultiplier: '1.50',
}

const NuxtLinkStub = {
  name: 'NuxtLink',
  props: ['to'],
  template: '<a :href="to"><slot /></a>',
}

function mountRow() {
  return mount(QuestionRow, {
    props: { question },
    global: {
      stubs: { NuxtLink: NuxtLinkStub },
    },
  })
}

describe('QuestionRow', () => {
  it('問題番号と問題文を表示する', () => {
    const wrapper = mountRow()

    expect(wrapper.find('.question-id').text()).toBe('Q3')
    expect(wrapper.find('.question-text').text()).toBe('日本の首都はどこでしょう?')
  })

  it('4つの選択肢を表示し、正解を強調する', () => {
    const wrapper = mountRow()

    const choices = wrapper.findAll('.question-choices li')
    expect(choices).toHaveLength(4)
    expect(choices[0].classes()).toContain('is-correct')
    expect(choices[1].classes()).not.toContain('is-correct')
  })

  it('自信度倍率を表示する', () => {
    const wrapper = mountRow()

    expect(wrapper.find('.multiplier-chip').text()).toContain('×1.50')
  })

  it('編集・倍率変更へのリンクを持つ', () => {
    const wrapper = mountRow()

    const links = wrapper.findAll('a.row-action-link')
    expect(links.map(link => link.attributes('href'))).toEqual([
      '/admin/problems/3/edit',
      '/admin/problems/3/multiplier',
    ])
  })
})
