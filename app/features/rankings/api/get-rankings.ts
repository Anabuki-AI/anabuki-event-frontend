import type { RankingEntry } from '../types'
import { request } from '~/lib/api/client'

export function fetchRanking(): Promise<RankingEntry[]> {
  return request<RankingEntry[]>('/rankings')
}

export function fetchMyRanking(userId: number): Promise<RankingEntry> {
  return request<RankingEntry>(`/rankings/users/${encodeURIComponent(String(userId))}`)
}
