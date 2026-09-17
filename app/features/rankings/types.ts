export interface RankingEntry {
  rank: number
  participantId: number
  displayName: string
}

/** GET /api/rankings のレスポンス(契約: docs/quiz-session-contract.md)。 */
export interface RankingsResponse {
  rankings: RankingEntry[]
  /** 参加者セッションがない場合は null。 */
  me: RankingEntry | null
}
