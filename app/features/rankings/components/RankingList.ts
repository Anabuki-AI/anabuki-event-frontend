/**
 * ランキング一覧(4位以下)の表示ユーティリティ(旧RankingList.vueのscript)。
 * テンプレートはpages/rankings.vueに統合済み。
 */
export function formatListPoints(points: number): string {
  return `${points.toLocaleString('ja-JP')}ポイント`
}

export function formatRank(rank: number): string {
  return `${rank}位`
}
