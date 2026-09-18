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

/** 自分の順位と累計点を画面表示用に整形する。 */
export function formatMyRankingLine(entry: RankingEntry): string {
  return `${entry.rank}位 あなた（${entry.displayName} さん）・${entry.totalPoints}点`
}
