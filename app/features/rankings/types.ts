/** GET /api/rankings の wire format (Rails JSON, snake_case). */
export interface RankingEntryWire {
  rank: number
  participant_id: string
  display_name: string
  total_points: number
}

/** Ranking data used by the frontend after the API boundary conversion. */
export interface RankingEntry {
  rank: number
  participantId: string
  displayName: string
  totalPoints: number
}

export interface RankingsResponseWire {
  rankings: RankingEntryWire[]
  me: RankingEntryWire | null
}

/** GET /api/rankings のレスポンスを画面用の型へ変換した結果。 */
export interface RankingsResponse {
  rankings: RankingEntry[]
  /** 参加者セッションがない場合は null。 */
  me: RankingEntry | null
}
