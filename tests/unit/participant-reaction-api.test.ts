import { beforeEach, describe, expect, it, vi } from 'vitest'
import { request } from '~/lib/api/client'
import { reportParticipantReaction } from '~/features/participants/api/report-reaction'

vi.mock('~/lib/api/client', () => ({ request: vi.fn() }))

const mockedRequest = vi.mocked(request)

describe('reportParticipantReaction', () => {
  beforeEach(() => mockedRequest.mockReset())

  it('posts the selected reaction with the participant session cookie', async () => {
    mockedRequest.mockResolvedValue(undefined)

    await expect(reportParticipantReaction({ reaction: '👏' })).resolves.toBeUndefined()
    expect(mockedRequest).toHaveBeenCalledWith('/participants/reactions', {
      method: 'POST',
      body: { reaction: '👏' },
      credentials: 'include',
    })
  })
})
