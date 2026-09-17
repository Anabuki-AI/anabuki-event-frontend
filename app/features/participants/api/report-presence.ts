import type { ParticipantPresence } from '../types'
import { request } from '~/lib/api/client'

/** Records the current participant's presence and returns the active and registered counts. */
export function reportParticipantPresence(): Promise<ParticipantPresence> {
  return request<ParticipantPresence>('/participants/presence', {
    method: 'POST',
    credentials: 'include',
  })
}
