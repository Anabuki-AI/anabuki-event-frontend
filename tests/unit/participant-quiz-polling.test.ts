import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  PARTICIPANT_QUIZ_POLL_INTERVAL_MS,
  createParticipantQuizPoller,
} from '~/features/participant-quiz/composables/use-participant-quiz-state'
import type { ParticipantQuizState } from '~/features/participant-quiz/types'

const waitingState: ParticipantQuizState = { event: null, question: null }

async function flushPromises() {
  await Promise.resolve()
  await Promise.resolve()
}

describe('参加者クイズのポーリング', () => {
  afterEach(() => {
    vi.useRealTimers()
    Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'visible' })
  })

  it('開始直後と5秒ごとに状態を取得する', async () => {
    vi.useFakeTimers()
    Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'visible' })
    const loadState = vi.fn().mockResolvedValue(waitingState)
    const onState = vi.fn()
    const poller = createParticipantQuizPoller({ loadState, onState, onError: vi.fn(), document })

    poller.start()
    await flushPromises()
    expect(loadState).toHaveBeenCalledTimes(1)
    expect(onState).toHaveBeenCalledWith(waitingState)

    await vi.advanceTimersByTimeAsync(PARTICIPANT_QUIZ_POLL_INTERVAL_MS)
    expect(loadState).toHaveBeenCalledTimes(2)
    poller.stop()
  })

  it('非表示中は取得せず、可視化された時点でただちに取得する', async () => {
    vi.useFakeTimers()
    Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'hidden' })
    const loadState = vi.fn().mockResolvedValue(waitingState)
    const poller = createParticipantQuizPoller({ loadState, onState: vi.fn(), onError: vi.fn(), document })

    poller.start()
    await vi.advanceTimersByTimeAsync(PARTICIPANT_QUIZ_POLL_INTERVAL_MS * 2)
    expect(loadState).not.toHaveBeenCalled()

    Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'visible' })
    document.dispatchEvent(new Event('visibilitychange'))
    await flushPromises()
    expect(loadState).toHaveBeenCalledTimes(1)
    poller.stop()
  })

  it('通信中は次のintervalで重複リクエストを送らない', async () => {
    vi.useFakeTimers()
    let resolveState: ((state: ParticipantQuizState) => void) | undefined
    const loadState = vi.fn(() => new Promise<ParticipantQuizState>((resolve) => {
      resolveState = resolve
    }))
    const poller = createParticipantQuizPoller({ loadState, onState: vi.fn(), onError: vi.fn(), document })

    poller.start()
    await vi.advanceTimersByTimeAsync(PARTICIPANT_QUIZ_POLL_INTERVAL_MS * 2)
    expect(loadState).toHaveBeenCalledTimes(1)

    resolveState?.(waitingState)
    await flushPromises()
    poller.stop()
  })
})
