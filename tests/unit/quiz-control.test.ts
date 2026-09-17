import { mount } from '@vue/test-utils'
import { defineComponent, nextTick } from 'vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  closeAnswers,
  fetchQuizState,
  publishQuestion,
  revealAnswer,
  startQuiz,
} from '~/features/quiz-control/api/client'
import { useQuizControl } from '~/features/quiz-control/useQuizControl'

vi.mock('~/features/quiz-control/api/client', () => ({
  closeAnswers: vi.fn(),
  fetchQuizState: vi.fn(),
  publishQuestion: vi.fn(),
  revealAnswer: vi.fn(),
  startQuiz: vi.fn(),
}))

const state = { event: null, questions: [] }
const mockedFetch = vi.mocked(fetchQuizState)
const mockedStart = vi.mocked(startQuiz)

const Harness = defineComponent({
  setup: useQuizControl,
  template: '<div />',
})

async function flushPromises() {
  await Promise.resolve()
  await nextTick()
}

describe('useQuizControl', () => {
  beforeEach(() => {
    mockedFetch.mockReset().mockResolvedValue(state)
    mockedStart.mockReset()
    vi.mocked(publishQuestion).mockReset()
    vi.mocked(closeAnswers).mockReset()
    vi.mocked(revealAnswer).mockReset()
  })

  it('進行操作後にstateを再取得し、二重操作を送らない', async () => {
    const wrapper = mount(Harness)
    await flushPromises()

    let resolveStart: ((value: typeof state) => void) | undefined
    mockedStart.mockImplementationOnce(() => new Promise(resolve => { resolveStart = resolve }))
    const control = wrapper.vm as unknown as ReturnType<typeof useQuizControl>

    const firstStart = control.start()
    const secondStart = control.start()
    expect(mockedStart).toHaveBeenCalledOnce()

    resolveStart?.(state)
    await Promise.all([firstStart, secondStart])

    expect(mockedFetch).toHaveBeenCalledTimes(2)
    expect((wrapper.vm as { noticeMessage: string }).noticeMessage).toBe('イベントを開始しました。')
    wrapper.unmount()
  })
})
