import { flushPromises, mount } from '@vue/test-utils'
import { defineComponent } from 'vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { request } from '~/lib/api/client'
import { fetchVotingRate, useVotingRate } from '~/features/voting-rate/use-voting-rate'

vi.mock('~/lib/api/client', () => ({ request: vi.fn() }))

const mockedRequest = vi.mocked(request)

describe('fetchVotingRate', () => {
  beforeEach(() => mockedRequest.mockReset())

  it('snake_caseのwire形式を画面用camelCase DTOへ変換する', async () => {
    mockedRequest.mockResolvedValueOnce({
      questions: [{ question_id: 12, position: 3, answered_count: 2, answered_rate: 0.67 }],
      total_participants: 3,
    })

    await expect(fetchVotingRate()).resolves.toEqual({
      questions: [{ questionId: 12, position: 3, answeredCount: 2, answeredRate: 0.67 }],
      totalParticipants: 3,
    })
    expect(mockedRequest).toHaveBeenCalledWith('/operator/voting-rate', {
      credentials: 'include',
      retry: 0,
    })
  })

  it('snake_caseの回答率からNaNではない表示用パーセントを算出する', async () => {
    mockedRequest.mockResolvedValueOnce({
      questions: [{ question_id: 12, position: 3, answered_count: 2, answered_rate: 0.67 }],
      total_participants: 3,
    })

    let votingRate: ReturnType<typeof useVotingRate> | undefined
    const wrapper = mount(defineComponent({
      setup() {
        votingRate = useVotingRate()
        return () => null
      },
    }))

    await flushPromises()

    expect(votingRate?.answeredRatePercent.value).toBe(67)
    expect(Number.isNaN(votingRate?.answeredRatePercent.value)).toBe(false)
    wrapper.unmount()
  })
})
