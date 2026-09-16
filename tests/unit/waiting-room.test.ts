import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, nextTick, ref } from 'vue'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { reportParticipantReaction } from '~/features/participants/api/report-reaction'
import { setupWaitingRoom } from '~/features/waiting/components/WaitingRoom'

vi.mock('~/features/participants/api/report-reaction', () => ({
  reportParticipantReaction: vi.fn(),
}))

const reportReaction = vi.mocked(reportParticipantReaction)
let wrapper: VueWrapper | undefined

beforeEach(() => {
  reportReaction.mockReset()
  reportReaction.mockResolvedValue(undefined)
})

afterEach(() => {
  wrapper?.unmount()
  wrapper = undefined
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe('setupWaitingRoom', () => {
  it('animates only an increase after the first successfully loaded count', async () => {
    vi.useFakeTimers()
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
      callback(0)
      return 1
    })
    vi.stubGlobal('cancelAnimationFrame', vi.fn())

    const participantCount = ref<number | null>(null)
    let room!: ReturnType<typeof setupWaitingRoom>
    wrapper = mount(defineComponent({
      setup() {
        room = setupWaitingRoom(participantCount)
        return () => h('div')
      },
    }))

    participantCount.value = 24
    await nextTick()
    expect(room.isCountUpdated.value).toBe(false)

    participantCount.value = 25
    await nextTick()
    expect(room.isCountUpdated.value).toBe(true)

    await vi.advanceTimersByTimeAsync(500)
    expect(room.isCountUpdated.value).toBe(false)

    participantCount.value = 24
    await nextTick()
    expect(room.isCountUpdated.value).toBe(false)
  })

  it('submits every reaction without delaying its local animation', async () => {
    vi.useFakeTimers()
    const participantCount = ref<number | null>(null)
    let room!: ReturnType<typeof setupWaitingRoom>
    wrapper = mount(defineComponent({
      setup() {
        room = setupWaitingRoom(participantCount)
        return () => h('div')
      },
    }))

    room.handleReact('👏')
    room.handleReact('🎉')

    expect(reportReaction).toHaveBeenNthCalledWith(1, { reaction: '👏' })
    expect(reportReaction).toHaveBeenNthCalledWith(2, { reaction: '🎉' })
    expect(room.lastReactedEmoji.value).toBe('🎉')

    await vi.advanceTimersByTimeAsync(500)
    expect(room.lastReactedEmoji.value).toBe('')
  })

  it('sends every rapid click of the same reaction', () => {
    const participantCount = ref<number | null>(null)
    let room!: ReturnType<typeof setupWaitingRoom>
    wrapper = mount(defineComponent({
      setup() {
        room = setupWaitingRoom(participantCount)
        return () => h('div')
      },
    }))

    room.handleReact('👏')
    room.handleReact('👏')
    room.handleReact('👏')

    expect(reportReaction).toHaveBeenCalledTimes(3)
    expect(reportReaction).toHaveBeenNthCalledWith(1, { reaction: '👏' })
    expect(reportReaction).toHaveBeenNthCalledWith(2, { reaction: '👏' })
    expect(reportReaction).toHaveBeenNthCalledWith(3, { reaction: '👏' })
  })

  it('keeps the local animation when a rate-limited reaction send fails', async () => {
    vi.useFakeTimers()
    reportReaction.mockRejectedValueOnce(new Error('429 Too Many Requests'))
    const participantCount = ref<number | null>(null)
    let room!: ReturnType<typeof setupWaitingRoom>
    wrapper = mount(defineComponent({
      setup() {
        room = setupWaitingRoom(participantCount)
        return () => h('div')
      },
    }))

    room.handleReact('👏')
    await flushPromises()

    expect(room.lastReactedEmoji.value).toBe('👏')
    await vi.advanceTimersByTimeAsync(500)
    expect(room.lastReactedEmoji.value).toBe('')
  })
})
