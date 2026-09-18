import { describe, expect, it } from 'vitest'
import { formatPoints, formatRank } from '../../app/features/rankings/components/RankingList'
import { rankingMedalFor } from '../../app/features/rankings/components/RankingTopCards'

describe('RankingList formatting', () => {
  it('formats ranks', () => {
    expect(formatRank(4)).toBe('4位')
  })

  it('formats positive, zero, and negative points', () => {
    expect(formatPoints(300)).toBe('300点')
    expect(formatPoints(0)).toBe('0点')
    expect(formatPoints(-50)).toBe('-50点')
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
