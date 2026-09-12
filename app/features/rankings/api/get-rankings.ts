import type { RankingEntry } from '../types'
import { request } from '~/lib/api/client'
import { fetchMockMyRanking, fetchMockRanking } from '../mock'

/**
 * バックエンドAPI(/api/rankings)未結合でも画面を確認できるよう
 * 仮データを返すフラグ。実API結合時に false にする。
 */
const USE_MOCK = true

export function fetchRanking(): Promise<RankingEntry[]> {
  if (USE_MOCK) {
    return fetchMockRanking()
  }
  return request<RankingEntry[]>('/rankings')
}

export function fetchMyRanking(userId: number): Promise<RankingEntry> {
  if (USE_MOCK) {
    return fetchMockMyRanking(userId)
  }
  return request<RankingEntry>(`/rankings/users/${encodeURIComponent(String(userId))}`)
}
