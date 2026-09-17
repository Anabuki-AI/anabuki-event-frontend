import { describe, expect, it } from 'vitest'
import { formatRank } from '../../app/features/rankings/components/RankingList'
import { rankingMedalFor } from '../../app/features/rankings/components/RankingTopCards'

describe('RankingList formatting', () => {
  it('formats ranks (API returns no points)', () => {
    expect(formatRank(4)).toBe('4位')
  })
})

describe('RankingTopCards medals', () => {
  it('assigns the medal to each of the top three ranks', () => {
    expect(rankingMedalFor(0)).toBe('🥇')
    expect(rankingMedalFor(1)).toBe('🥈')
    expect(rankingMedalFor(2)).toBe('🥉')
  })

  it('falls back to the generic medal beyond the top three', () => {
    expect(rankingMedalFor(3)).toBe('🏅')
  })
})
