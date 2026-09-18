/**
 * ランキング一覧(4位以下)の表示ユーティリティ(旧RankingList.vueのscript)。
 * テンプレートはpages/rankings.vueに統合済み。
 * API契約の順位を画面表示用に整形する。
 */
export function formatRank(rank: number): string {
  return `${rank}位`
}

/** 累計点をランキング画面の表示用に整形する。 */
export function formatPoints(points: number): string {
  return `${points}点`
}
