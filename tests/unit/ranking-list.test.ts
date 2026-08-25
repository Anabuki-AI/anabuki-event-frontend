import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import RankingList from '../../app/features/rankings/components/RankingList.vue'
import RankingTopCards from '../../app/features/rankings/components/RankingTopCards.vue'

const entries = [
  { rank: 4, userName: 'dave', points: 200 },
  { rank: 4, userName: 'dave', points: 200 },
  { rank: 6, userName: 'frank', points: 120 },
]

describe('RankingList', () => {
  it('renders every entry with rank and locale-formatted points', () => {
    const wrapper = mount(RankingList, { props: { entries } })

    const items = wrapper.findAll('li.ranking-list-item')
    expect(items).toHaveLength(3)
    expect(items[0].text()).toContain('4位')
    expect(items[0].text()).toContain('200 pt')
    expect(items[2].text()).toContain('6位')
    expect(items[2].text()).toContain('120 pt')
  })
})

describe('RankingTopCards', () => {
  it('renders one card per entry with the rank text', () => {
    const topThree = [
      { rank: 1, userName: 'alice', points: 12345 },
      { rank: 1, userName: 'bob', points: 12345 },
      { rank: 3, userName: 'carol', points: 280 },
    ]
    const wrapper = mount(RankingTopCards, { props: { entries: topThree } })

    const cards = wrapper.findAll('li.ranking-card')
    expect(cards).toHaveLength(3)
    expect(cards[0].text()).toContain('1位')
    expect(cards[0].text()).toContain('12,345')
    expect(cards[2].text()).toContain('3位')
  })
})
