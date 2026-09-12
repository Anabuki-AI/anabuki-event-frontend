import { describe, expect, it } from 'vitest'
import { formatListPoints, formatRank } from '../../app/features/rankings/components/RankingList'
import { rankingMedalFor } from '../../app/features/rankings/components/RankingTopCards'

describe('RankingList formatting', () => {
  it('formats every entry with rank and locale-formatted points', () => {
    expect(formatRank(4)).toBe('4位')
    expect(formatListPoints(200)).toBe('200ポイント')
  })

  it('formats large points with locale separators', () => {
    expect(formatListPoints(12345)).toBe('12,345ポイント')
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
