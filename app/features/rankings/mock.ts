import { ApiError } from '~/lib/api/error'
import type { RankingEntry } from './types'

/**
 * バックエンドのランキングAPI(/api/rankings)未結合時に使う仮データ。
 * 実API連携への切替は api/get-rankings.ts の USE_MOCK を false にする。
 */
export const mockRanking: RankingEntry[] = [
  { rank: 1, userId: 101, userName: 'アナブキ太郎', points: 320 },
  { rank: 2, userId: 102, userName: 'さくら', points: 280 },
  { rank: 3, userId: 103, userName: 'たけし', points: 240 },
  { rank: 4, userId: 104, userName: 'ゆい', points: 210 },
  { rank: 5, userId: 105, userName: 'こうた', points: 180 },
  { rank: 6, userId: 106, userName: 'めい', points: 150 },
  { rank: 7, userId: 107, userName: 'シュン', points: 120 },
  { rank: 8, userId: 108, userName: 'ひな', points: 90 },
  { rank: 9, userId: 109, userName: 'りく', points: 60 },
  { rank: 10, userId: 110, userName: 'エミリー', points: 30 },
]

export async function fetchMockRanking(): Promise<RankingEntry[]> {
  // 要素もコピーして呼び出し元の変更がモック本体へ漏れないようにする
  return mockRanking.map(entry => ({ ...entry }))
}

export async function fetchMockMyRanking(userId: number): Promise<RankingEntry> {
  const found = mockRanking.find(entry => entry.userId === userId)
  if (found == null) {
    // 未知のuserIdは実APIと同じ404扱いにする
    throw new ApiError(`userId ${userId} のランキングが見つかりません`, 404)
  }
  return { ...found }
}
