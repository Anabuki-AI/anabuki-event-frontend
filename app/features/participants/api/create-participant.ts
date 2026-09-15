import type { Participant, ParticipantRegistration } from '../types'
import { request } from '~/lib/api/client'

export function createParticipant(input: ParticipantRegistration): Promise<Participant> {
  return request<Participant>('/participants', {
    method: 'POST',
    body: input,
  })
}
