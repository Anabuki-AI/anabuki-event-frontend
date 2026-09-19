import { describe, expect, it } from 'vitest'
import {
  formatMyRankingLine,
  myRankingViewState,
} from '../../app/features/rankings/components/MyRankingPanel'

describe('myRankingViewState', () => {
  it('prefers the loading state while fetching', () => {
    expect(myRankingViewState(null, '', true)).toBe('loading')
    expect(myRankingViewState({ rank: 1, participantId: '1', displayName: 'alice', totalPoints: 100 }, '', true)).toBe('loading')
  })

  it('reports the entry state when an entry exists', () => {
    expect(myRankingViewState({ rank: 1, participantId: '1', displayName: 'alice', totalPoints: 100 }, '', false)).toBe('entry')
  })

  it('reports the error state when loading finished without an entry', () => {
    expect(myRankingViewState(null, '通信に失敗しました。', false)).toBe('error')
  })
})

describe('formatMyRankingLine', () => {
  it('formats the entry as rank + display name + total points', () => {
    const line = formatMyRankingLine({ rank: 256, participantId: '1', displayName: 'alice', totalPoints: -50 })

    expect(line).toBe('256位 あなた（alice さん）・-50点')
  })
})
