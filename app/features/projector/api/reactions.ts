import type { ProjectorReactionFeed } from '../types'
import { request } from '~/lib/api/client'

/**
 * 待機中に参加者が押したリアクションの読み取り専用フィード(運営セッションCookie)。
 * since 省略時は履歴を返さずカーソルだけ返す(過去分を再生しないため)。
 */
export function fetchReactionFeed(since: string | null): Promise<ProjectorReactionFeed> {
  return request<ProjectorReactionFeed>('/operator/quiz/reactions', {
    query: since ? { since } : undefined,
    credentials: 'include',
    retry: 0,
  })
}
