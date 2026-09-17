import type { RankingsResponse } from '../types'
import { request } from '~/lib/api/client'

/** 参加者・運営双方から呼べるランキングAPI(契約: docs/quiz-session-contract.md)。 */
export function fetchRankings(): Promise<RankingsResponse> {
  return request<RankingsResponse>('/rankings', { credentials: 'include', retry: 0 })
}
