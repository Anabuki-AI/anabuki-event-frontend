import { mount } from '@vue/test-utils'
import { defineComponent, nextTick } from 'vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  closeAnswers,
  closeAnswersImmediately,
  fetchQuizState,
  finishQuiz,
  publishQuestion,
  revealAnswer,
  startQuiz,
} from '~/features/quiz-control/api/client'
import { useQuizControl } from '~/features/quiz-control/useQuizControl'
import { ApiError } from '~/lib/api/error'

vi.mock('~/features/quiz-control/api/client', () => ({
  closeAnswers: vi.fn(),
  closeAnswersImmediately: vi.fn(),
  fetchQuizState: vi.fn(),
  finishQuiz: vi.fn(),
  publishQuestion: vi.fn(),
  revealAnswer: vi.fn(),
  startQuiz: vi.fn(),
}))

const state = {
  status: 'waiting',
  phase: null,
  current: null,
  question_count: 10,
  total_participants: 60,
}
const mockedFetch = vi.mocked(fetchQuizState)
const mockedStart = vi.mocked(startQuiz)
const mockedPublish = vi.mocked(publishQuestion)
const mockedFinish = vi.mocked(finishQuiz)

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
    mockedPublish.mockReset()
    vi.mocked(closeAnswers).mockReset()
    vi.mocked(closeAnswersImmediately).mockReset()
    vi.mocked(revealAnswer).mockReset()
    mockedFinish.mockReset()
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

  it('公開は位置を推測せずサーバーへ委譲する', async () => {
    const wrapper = mount(Harness)
    await flushPromises()
    mockedFetch.mockResolvedValueOnce({
      ...state,
      status: 'in_progress',
      phase: 'revealed',
      current: {
        question_id: 1,
        position: 1,
        question_text: 'Q1',
        choices: { A: 'a', B: 'b', C: 'c', D: 'd' },
        image_url: null,
        correct_answer: 'A',
        answered_count: 0,
        answered_rate: 0,
      },
    })

    const control = wrapper.vm as unknown as ReturnType<typeof useQuizControl>
    // 次問の位置はAPI stateに含まれる事実を表示に使うだけで、POSTには送らない。
    await control.refresh()
    mockedPublish.mockResolvedValueOnce(state)
    await control.publish()

    expect(mockedPublish).toHaveBeenCalledOnce()
    expect(mockedPublish).toHaveBeenCalledWith()
    wrapper.unmount()
  })

  it('422の不正遷移では専用メッセージを表示して再取得する', async () => {
    const wrapper = mount(Harness)
    await flushPromises()

    mockedStart.mockReset()
    mockedStart.mockRejectedValueOnce(new Error('invalid transition'))
    mockedStart.mockRejectedValueOnce(new ApiError('invalid transition', 422))
    const control = wrapper.vm as unknown as ReturnType<typeof useQuizControl>

    await control.start()
    expect((wrapper.vm as { errorMessage: string }).errorMessage).not.toBe('')

    await control.start()
    expect((wrapper.vm as { errorMessage: string }).errorMessage).toContain('現在の状態では実行できない操作')
    wrapper.unmount()
  })

  it('手動締め切りは10秒カウントダウンを開始する', async () => {
    const wrapper = mount(Harness)
    await flushPromises()
    vi.mocked(closeAnswers).mockResolvedValueOnce(state)

    const control = wrapper.vm as unknown as ReturnType<typeof useQuizControl>
    await control.close()

    expect(closeAnswers).toHaveBeenCalledOnce()
    expect((wrapper.vm as { noticeMessage: string }).noticeMessage).toBe('10秒後に解答受付を締め切ります。')
    wrapper.unmount()
  })

  it('終了操作を実行できる', async () => {
    const wrapper = mount(Harness)
    await flushPromises()

    const control = wrapper.vm as unknown as ReturnType<typeof useQuizControl>
    mockedFinish.mockResolvedValueOnce({ ...state, status: 'finished' })
    await control.finish()

    expect(mockedFinish).toHaveBeenCalledOnce()
    expect((wrapper.vm as { noticeMessage: string }).noticeMessage).toBe('クイズ大会を終了しました。')
    wrapper.unmount()
  })
})
