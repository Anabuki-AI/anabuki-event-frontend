import type { OperatorParticipant } from '../types'
import { request } from '~/lib/api/client'

const credentials = 'include' as const

/** オペレーターセッション Cookie を使う参加者管理API。 */
export function fetchOperatorParticipants(): Promise<OperatorParticipant[]> {
  return request<OperatorParticipant[]>('/operator/participants', { credentials, retry: 0 })
}

export async function deleteOperatorParticipant(id: number): Promise<void> {
  await request<unknown>(`/operator/participants/${id}`, { method: 'DELETE', credentials, retry: 0 })
}
