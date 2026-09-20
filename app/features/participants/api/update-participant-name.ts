import type { Participant } from '../types'
import { request } from '~/lib/api/client'

export function updateParticipantName(displayName: string): Promise<Participant> {
  return request<Participant>('/participants/me', {
    method: 'PATCH',
    body: { displayName },
  })
}
