/**
 * ランキング一覧(4位以下)の表示ユーティリティ(旧RankingList.vueのscript)。
 * テンプレートはpages/rankings.vueに統合済み。
 * API契約では得点を返さないため、順位の整形のみ提供する。
 */
export function formatRank(rank: number): string {
  return `${rank}位`
}
