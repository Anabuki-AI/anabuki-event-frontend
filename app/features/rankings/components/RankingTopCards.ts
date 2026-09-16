/**
 * ランキング上位3名のカード定義(旧RankingTopCards.vueのscript)。
 * テンプレートはpages/rankings.vueに統合済み。
 */
export const RANKING_MEDALS = ['🥇', '🥈', '🥉'] as const

export function rankingMedalFor(index: number): string {
  return RANKING_MEDALS[index] ?? '🏅'
}
