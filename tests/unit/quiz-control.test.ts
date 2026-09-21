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
  resetQuiz,
  startQuiz,
  updateCorrectAnswer,
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
  resetQuiz: vi.fn(),
  startQuiz: vi.fn(),
  updateCorrectAnswer: vi.fn(),
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
const mockedReset = vi.mocked(resetQuiz)
const mockedUpdateCorrectAnswer = vi.mocked(updateCorrectAnswer)

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
    mockedReset.mockReset()
    mockedUpdateCorrectAnswer.mockReset()
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

  it('中継問題の正解変更をサーバーへ委譲し、最新stateを取得する', async () => {
    const wrapper = mount(Harness)
    await flushPromises()
    mockedUpdateCorrectAnswer.mockResolvedValueOnce(state)

    const control = wrapper.vm as unknown as ReturnType<typeof useQuizControl>
    await control.setCorrectAnswer('C')

    expect(mockedUpdateCorrectAnswer).toHaveBeenCalledWith('C')
    expect((wrapper.vm as { noticeMessage: string }).noticeMessage).toBe('正解をCに設定しました。')
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

  it('リセット成功後に最新stateを再取得し、通知と履歴を更新する', async () => {
    const wrapper = mount(Harness)
    await flushPromises()

    const resetState = {
      ...state,
      status: 'waiting' as const,
      phase: null,
      current: null,
      reset_operation: {
        operation_id: 'operation-1',
        started_at: '2026-09-30T00:00:00.000000Z',
        completed_at: '2026-09-30T00:00:00.025000Z',
        affected_rows: {
          participant_answers: 0,
          confidence_selections: 0,
          participant_sessions: 0,
          participants: 0,
          question_reveals: 0,
          quiz_sessions: 1,
        },
      },
    }
    mockedReset.mockResolvedValueOnce(resetState)
    mockedFetch.mockResolvedValueOnce(resetState)
    const control = wrapper.vm as unknown as ReturnType<typeof useQuizControl>

    await expect(control.reset('RESET')).resolves.toBe(true)

    expect(mockedReset).toHaveBeenCalledWith('RESET')
    expect(mockedFetch).toHaveBeenCalledTimes(2)
    expect((wrapper.vm as { state: typeof resetState }).state).toEqual(resetState)
    expect((wrapper.vm as { noticeMessage: string }).noticeMessage).toBe('クイズ大会を開始前の状態に戻しました。')
    expect((wrapper.vm as { history: { label: string }[] }).history.at(-1)?.label).toBe('クイズ大会をリセット')
    expect((wrapper.vm as { resetOperation: typeof resetState.reset_operation | null }).resetOperation).toEqual(resetState.reset_operation)

    // GET state refreshes do not include the one-time POST receipt.
    await control.refresh()
    expect((wrapper.vm as { resetOperation: typeof resetState.reset_operation | null }).resetOperation).toEqual(resetState.reset_operation)

    // A later failed reset must not leave the previous receipt visible.
    mockedReset.mockRejectedValueOnce(new ApiError('confirmation must exactly equal RESET', 422))
    await expect(control.reset('RESET')).resolves.toBe(false)
    expect((wrapper.vm as { resetOperation: unknown }).resetOperation).toBeNull()
    wrapper.unmount()
  })

  it('リセットPOST成功後のstate再取得失敗をリセット失敗として扱わず、受付票を保持する', async () => {
    const wrapper = mount(Harness)
    await flushPromises()

    const resetState = {
      ...state,
      reset_operation: {
        operation_id: 'operation-refresh-failure',
        started_at: '2026-09-30T00:00:00.000000Z',
        completed_at: '2026-09-30T00:00:00.025000Z',
        affected_rows: {
          participant_answers: 0,
          confidence_selections: 0,
          participant_sessions: 0,
          participants: 0,
          question_reveals: 0,
          quiz_sessions: 1,
        },
      },
    }
    mockedReset.mockResolvedValueOnce(resetState)
    mockedFetch.mockRejectedValueOnce(new Error('state refresh failed'))
    const control = wrapper.vm as unknown as ReturnType<typeof useQuizControl>

    await expect(control.reset('RESET')).resolves.toBe(true)

    expect((wrapper.vm as { resetOperation: typeof resetState.reset_operation | null }).resetOperation).toEqual(resetState.reset_operation)
    expect((wrapper.vm as { noticeMessage: string }).noticeMessage).toBe('クイズ大会を開始前の状態に戻しました。')
    expect((wrapper.vm as { errorMessage: string }).errorMessage).toBe('state refresh failed')
    expect((wrapper.vm as { isActing: boolean }).isActing).toBe(false)
    wrapper.unmount()
  })

  it('リセット失敗時はエラーを表示して最新stateを再取得する', async () => {
    const wrapper = mount(Harness)
    await flushPromises()

    mockedReset.mockRejectedValueOnce(new ApiError('confirmation must exactly equal RESET', 422))
    const control = wrapper.vm as unknown as ReturnType<typeof useQuizControl>

    await expect(control.reset('RESET')).resolves.toBe(false)

    expect(mockedFetch).toHaveBeenCalledTimes(2)
    expect((wrapper.vm as { errorMessage: string }).errorMessage).toBe('confirmation must exactly equal RESET')
    expect((wrapper.vm as { isActing: boolean }).isActing).toBe(false)
    wrapper.unmount()
  })
})
