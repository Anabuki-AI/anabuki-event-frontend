import { afterEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, nextTick, ref } from 'vue'
import { mount, type VueWrapper } from '@vue/test-utils'
import { setupWaitingRoom } from '~/features/waiting/components/WaitingRoom'

let wrapper: VueWrapper | undefined

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
})
