import { beforeEach, describe, expect, it, vi } from 'vitest'
import { request } from '~/lib/api/client'
import { reportParticipantPresence } from '~/features/participants/api/report-presence'

vi.mock('~/lib/api/client', () => ({ request: vi.fn() }))

const mockedRequest = vi.mocked(request)

describe('reportParticipantPresence', () => {
  beforeEach(() => mockedRequest.mockReset())

  it('posts presence with the participant session cookie and returns the API response', async () => {
    const presence = {
      activeParticipantCount: 24,
      totalParticipantCount: 60,
      observedAt: '2026-09-28T01:00:00Z',
      activeWindowSeconds: 60,
    }
    mockedRequest.mockResolvedValue(presence)

    await expect(reportParticipantPresence()).resolves.toEqual(presence)
    expect(mockedRequest).toHaveBeenCalledWith('/participants/presence', {
      method: 'POST',
      credentials: 'include',
    })
  })
})
