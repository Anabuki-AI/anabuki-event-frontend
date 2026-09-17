import { request } from '~/lib/api/client'

/** 参加者セッションを終了する(HttpOnly Cookie をサーバー側で無効化)。 */
export async function deleteParticipantSession(): Promise<void> {
  await request<unknown>('/participants/session', { method: 'DELETE', credentials: 'include', retry: 0 })
}
