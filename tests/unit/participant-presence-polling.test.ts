import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h } from 'vue'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { reportParticipantPresence } from '~/features/participants/api/report-presence'
import {
  PARTICIPANT_PRESENCE_POLL_INTERVAL_MS,
  useParticipantPresence,
} from '~/features/participants/composables/use-participant-presence'

vi.mock('~/features/participants/api/report-presence', () => ({
  reportParticipantPresence: vi.fn(),
}))

const reportPresence = vi.mocked(reportParticipantPresence)
const presence = {
  activeParticipantCount: 24,
  observedAt: '2026-09-28T01:00:00Z',
  activeWindowSeconds: 60,
}

let wrapper: VueWrapper | undefined
let state: ReturnType<typeof useParticipantPresence>
let visibilityState: ReturnType<typeof vi.spyOn>

function mountPresenceProbe() {
  wrapper = mount(defineComponent({
    setup() {
      state = useParticipantPresence()
      return () => h('div')
    },
  }))
  return state
}

beforeEach(() => {
  vi.useFakeTimers()
  reportPresence.mockReset()
  reportPresence.mockResolvedValue(presence)
  visibilityState = vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('visible')
})

afterEach(() => {
  wrapper?.unmount()
  wrapper = undefined
  vi.useRealTimers()
  vi.restoreAllMocks()
})

describe('useParticipantPresence', () => {
  it('reports immediately on mount and every 20 seconds while visible', async () => {
    const current = mountPresenceProbe()
    await flushPromises()

    expect(reportPresence).toHaveBeenCalledTimes(1)
    expect(current.participantCount.value).toBe(24)

    await vi.advanceTimersByTimeAsync(PARTICIPANT_PRESENCE_POLL_INTERVAL_MS)
    expect(reportPresence).toHaveBeenCalledTimes(2)
  })

  it('stops while hidden, then reports immediately and resumes when visible again', async () => {
    mountPresenceProbe()
    await flushPromises()

    visibilityState.mockReturnValue('hidden')
    document.dispatchEvent(new Event('visibilitychange'))
    await vi.advanceTimersByTimeAsync(PARTICIPANT_PRESENCE_POLL_INTERVAL_MS * 2)
    expect(reportPresence).toHaveBeenCalledTimes(1)

    visibilityState.mockReturnValue('visible')
    document.dispatchEvent(new Event('visibilitychange'))
    await flushPromises()
    expect(reportPresence).toHaveBeenCalledTimes(2)

    await vi.advanceTimersByTimeAsync(PARTICIPANT_PRESENCE_POLL_INTERVAL_MS)
    expect(reportPresence).toHaveBeenCalledTimes(3)
  })

  it('does not overlap requests from the timer or a visibility event', async () => {
    let resolvePresence!: (value: typeof presence) => void
    reportPresence.mockImplementation(() => new Promise(resolve => { resolvePresence = resolve }))
    mountPresenceProbe()

    await vi.advanceTimersByTimeAsync(PARTICIPANT_PRESENCE_POLL_INTERVAL_MS)
    document.dispatchEvent(new Event('visibilitychange'))
    expect(reportPresence).toHaveBeenCalledOnce()

    resolvePresence(presence)
    await flushPromises()
    expect(state.participantCount.value).toBe(24)
  })

  it('keeps the last successful count when a later request fails', async () => {
    reportPresence.mockResolvedValueOnce(presence).mockRejectedValueOnce(new Error('network'))
    const current = mountPresenceProbe()
    await flushPromises()

    await vi.advanceTimersByTimeAsync(PARTICIPANT_PRESENCE_POLL_INTERVAL_MS)
    expect(current.participantCount.value).toBe(24)
  })

  it('removes the timer and visibility listener on unmount', async () => {
    mountPresenceProbe()
    await flushPromises()
    wrapper!.unmount()

    await vi.advanceTimersByTimeAsync(PARTICIPANT_PRESENCE_POLL_INTERVAL_MS * 2)
    document.dispatchEvent(new Event('visibilitychange'))
    expect(reportPresence).toHaveBeenCalledOnce()
  })
})
