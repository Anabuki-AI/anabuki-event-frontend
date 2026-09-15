import type { Participant } from '../types'
import { request } from '~/lib/api/client'

export function getCurrentParticipant(): Promise<Participant> {
  return request<Participant>('/participants/me')
}
