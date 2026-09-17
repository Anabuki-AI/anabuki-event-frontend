import type { ParticipantReactionRequest } from '../types'
import { request } from '~/lib/api/client'

/** Records a participant's waiting-room reaction. The API returns 201 with no response body. */
export async function reportParticipantReaction(input: ParticipantReactionRequest): Promise<void> {
  await request<null>('/participants/reactions', {
    method: 'POST',
    body: input,
    credentials: 'include',
  })
}
