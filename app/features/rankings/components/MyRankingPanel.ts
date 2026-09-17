import type { RankingEntry } from '../types'

/**
 * 自分の順位パネルの表示状態判定(旧MyRankingPanel.vueのscript)。
 * テンプレートはpages/rankings.vueに統合済み。
 */
export type MyRankingViewState = 'loading' | 'entry' | 'error'

export function myRankingViewState(
  entry: RankingEntry | null,
  errorMessage: string,
  loading: boolean,
): MyRankingViewState {
  if (loading) {
    return 'loading'
  }
  if (entry !== null) {
    return 'entry'
  }
  if (errorMessage !== '') {
    return 'error'
  }
  return 'entry'
}

/** API契約では得点を返さないため、順位と参加者名で構成する。 */
export function formatMyRankingLine(entry: RankingEntry): string {
  return `${entry.rank}位 あなた（${entry.displayName} さん）`
}
