import { describe, expect, it } from 'vitest'
import {
  formatMyRankingLine,
  myRankingViewState,
} from '../../app/features/rankings/components/MyRankingPanel'

describe('myRankingViewState', () => {
  it('prefers the loading state while fetching', () => {
    expect(myRankingViewState(null, '', true)).toBe('loading')
    expect(myRankingViewState({ rank: 1, userId: 1, userName: 'alice', points: 0 }, '', true)).toBe('loading')
  })

  it('reports the entry state when an entry exists', () => {
    expect(myRankingViewState({ rank: 1, userId: 1, userName: 'alice', points: 0 }, '', false)).toBe('entry')
  })

  it('reports the error state when loading finished without an entry', () => {
    expect(myRankingViewState(null, '通信に失敗しました。', false)).toBe('error')
  })
})

describe('formatMyRankingLine', () => {
  it('formats the entry in the miro spec format: rank + あなたは + points', () => {
    const line = formatMyRankingLine({ rank: 256, userId: 1, userName: 'alice', points: 0 })

    expect(line).toBe('256位 あなたは 0ポイント')
  })

  it('formats large points with locale separators', () => {
    const line = formatMyRankingLine({ rank: 42, userId: 1, userName: 'alice', points: 12345 })

    expect(line).toContain('42位 あなたは 12,345ポイント')
  })
})
