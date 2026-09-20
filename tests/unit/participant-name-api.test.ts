import { beforeEach, describe, expect, it, vi } from 'vitest'
import { updateParticipantName } from '~/features/participants/api/update-participant-name'
import { request } from '~/lib/api/client'

vi.mock('~/lib/api/client', () => ({ request: vi.fn() }))

const mockedRequest = vi.mocked(request)

describe('updateParticipantName', () => {
  beforeEach(() => mockedRequest.mockReset())

  it('patches only the display name for the current participant', async () => {
    const participant = { id: 'participant-id', displayName: 'Updated Player' }
    mockedRequest.mockResolvedValue(participant)

    await expect(updateParticipantName('Updated Player')).resolves.toEqual(participant)
    expect(mockedRequest).toHaveBeenCalledWith('/participants/me', {
      method: 'PATCH',
      body: { displayName: 'Updated Player' },
    })
  })
})
