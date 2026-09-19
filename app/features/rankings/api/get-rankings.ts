import type { RankingEntryWire, RankingsResponse, RankingsResponseWire } from '../types'
import { request } from '~/lib/api/client'

function toRankingEntry(entry: RankingEntryWire) {
  return {
    rank: entry.rank,
    participantId: String(entry.participant_id),
    displayName: entry.display_name,
    totalPoints: entry.total_points,
  }
}

function fromWire(response: RankingsResponseWire): RankingsResponse {
  return {
    rankings: response.rankings.map(toRankingEntry),
    me: response.me ? toRankingEntry(response.me) : null,
  }
}

/** 参加者・運営双方から呼べるランキングAPI。wire形式を画面用DTOへ変換する。 */
export async function fetchRankings(): Promise<RankingsResponse> {
  const response = await request<RankingsResponseWire>('/rankings', { credentials: 'include', retry: 0 })
  return fromWire(response)
}
