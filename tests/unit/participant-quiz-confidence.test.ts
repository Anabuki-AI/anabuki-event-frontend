import { mount } from '@vue/test-utils'
import { defineComponent, nextTick } from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  confirmParticipantQuizConfidence,
  fetchParticipantQuizState,
  submitParticipantQuizAnswer,
} from '~/features/participant-quiz/api/client'
import { useParticipantQuizAnswer } from '~/features/participant-quiz/composables/use-participant-quiz-answer'
import type { ParticipantQuizState } from '~/features/participant-quiz/types'

vi.mock('~/features/participant-quiz/api/client', () => ({
  confirmParticipantQuizConfidence: vi.fn(),
  fetchParticipantQuizState: vi.fn(),
  submitParticipantQuizAnswer: vi.fn(),
}))

const mockedConfirmConfidence = vi.mocked(confirmParticipantQuizConfidence)
const mockedFetchState = vi.mocked(fetchParticipantQuizState)
const mockedSubmitAnswer = vi.mocked(submitParticipantQuizAnswer)

const unlockedState: ParticipantQuizState = {
  status: 'in_progress',
  phase: 'answering',
  question: {
    question_id: 12,
    position: 2,
    question_text: '問題文',
    choices: { A: 'A', B: 'B', C: 'C', D: 'D' },
    image_url: null,
  },
  answered: false,
  my_answer: null,
  correct_answer: null,
  confidence_level: null,
  confidence_locked: false,
  confidence_multipliers: { high: 2, normal: 1, low: 0.5 },
}

const lowLockedState: ParticipantQuizState = {
  ...unlockedState,
  question: {
    ...unlockedState.question!,
    choices: { A: 'A', B: 'B', D: 'D' },
  },
  confidence_level: 'low',
  confidence_locked: true,
}

const submittedState: ParticipantQuizState = {
  ...unlockedState,
  answered: true,
  my_answer: { choice: 'B', confidence_level: 'normal' },
  confidence_level: 'normal',
  confidence_locked: true,
}

const Harness = defineComponent({
  setup: () => useParticipantQuizAnswer({ onWaiting: vi.fn(), onUnauthorized: vi.fn() }),
  template: '<div />',
})

function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (error: unknown) => void
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise
    reject = rejectPromise
  })
  return { promise, resolve, reject }
}

async function flushPromises() {
  await Promise.resolve()
  await nextTick()
}

describe('参加者クイズのレベル確定', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  beforeEach(() => {
    mockedConfirmConfidence.mockReset()
    mockedFetchState.mockReset().mockResolvedValue(unlockedState)
    mockedSubmitAnswer.mockReset()
  })

  it('Lv.1〜3を実倍率と対応付け、Lv未確定では解答を送れない', async () => {
    const wrapper = mount(Harness)
    await flushPromises()

    const vm = wrapper.vm as unknown as ReturnType<typeof useParticipantQuizAnswer>
    expect((vm as unknown as { confidenceOptions: unknown }).confidenceOptions).toEqual([
      { value: 'low', label: 'Lv.1', multiplier: '×0.50' },
      { value: 'normal', label: 'Lv.2', multiplier: '×1.00' },
      { value: 'high', label: 'Lv.3', multiplier: '×2.00' },
    ])
    expect((vm as unknown as { isConfidenceLocked: boolean }).isConfidenceLocked).toBe(false)
    expect((vm as unknown as { canSubmit: boolean }).canSubmit).toBe(false)
    wrapper.unmount()
  })

  it('Lv.1は確認後だけサーバーへ確定し、返却された3択を使う', async () => {
    mockedConfirmConfidence.mockResolvedValueOnce(lowLockedState)
    const wrapper = mount(Harness)
    await flushPromises()

    const vm = wrapper.vm as unknown as ReturnType<typeof useParticipantQuizAnswer>
    ;(vm as unknown as { selectConfidenceLevel: (level: 'low') => void }).selectConfidenceLevel('low')
    expect((vm as unknown as { isConfidenceConfirmOpen: boolean }).isConfidenceConfirmOpen).toBe(true)
    expect(mockedConfirmConfidence).not.toHaveBeenCalled()

    await (vm as unknown as { confirmPendingConfidenceSelection: () => Promise<void> }).confirmPendingConfidenceSelection()
    await flushPromises()

    expect(mockedConfirmConfidence).toHaveBeenCalledWith({ question_id: 12, confidence_level: 'low' })
    expect((vm as unknown as { isConfidenceLocked: boolean }).isConfidenceLocked).toBe(true)
    expect((vm as unknown as { lockedConfidenceLevel: string }).lockedConfidenceLevel).toBe('low')
    expect((vm as unknown as { choices: { key: string }[] }).choices.map(choice => choice.key)).toEqual(['A', 'B', 'D'])
    wrapper.unmount()
  })

  it('確定済みLvを変更せず、そのLvだけで回答を送る', async () => {
    mockedFetchState.mockResolvedValue(lowLockedState)
    mockedSubmitAnswer.mockResolvedValueOnce({ my_answer: { choice: 'B', confidence_level: 'low' } })
    const wrapper = mount(Harness)
    await flushPromises()

    const vm = wrapper.vm as unknown as ReturnType<typeof useParticipantQuizAnswer>
    ;(vm as unknown as { selectConfidenceLevel: (level: 'high') => void }).selectConfidenceLevel('high')
    expect(mockedConfirmConfidence).not.toHaveBeenCalled()

    ;(vm as unknown as { selectedChoice: 'B' }).selectedChoice = 'B'
    await (vm as unknown as { submitAnswer: () => Promise<void> }).submitAnswer()

    expect(mockedSubmitAnswer).toHaveBeenCalledWith({ question_id: 12, choice: 'B' })
    wrapper.unmount()
  })

  it('送信後は受付済み回答とdraftを分離し、タップだけでは再送しない', async () => {
    mockedFetchState.mockResolvedValue(submittedState)
    const wrapper = mount(Harness)
    await flushPromises()

    const vm = wrapper.vm as unknown as ReturnType<typeof useParticipantQuizAnswer>
    ;(vm as unknown as { beginAnswerEditing: () => void }).beginAnswerEditing()
    expect((vm as unknown as { isEditingAnswer: boolean }).isEditingAnswer).toBe(true)
    expect((vm as unknown as { selectedChoice: string }).selectedChoice).toBe('B')

    ;(vm as unknown as { selectedChoice: 'C' }).selectedChoice = 'C'
    expect((vm as unknown as { hasDraftChange: boolean }).hasDraftChange).toBe(true)
    expect((vm as unknown as { canSubmit: boolean }).canSubmit).toBe(true)
    expect((vm as unknown as { myAnswer: { choice: string } }).myAnswer.choice).toBe('B')
    expect(mockedSubmitAnswer).not.toHaveBeenCalled()

    ;(vm as unknown as { cancelAnswerEditing: () => void }).cancelAnswerEditing()
    expect((vm as unknown as { isEditingAnswer: boolean }).isEditingAnswer).toBe(false)
    expect((vm as unknown as { selectedChoice: string | undefined }).selectedChoice).toBeUndefined()
    expect((vm as unknown as { myAnswer: { choice: string } }).myAnswer.choice).toBe('B')
    wrapper.unmount()
  })

  it('変更送信の通信失敗では元の受付済み回答を保持する', async () => {
    mockedFetchState.mockResolvedValue(submittedState)
    mockedSubmitAnswer.mockRejectedValueOnce(new Error('offline'))
    const wrapper = mount(Harness)
    await flushPromises()

    const vm = wrapper.vm as unknown as ReturnType<typeof useParticipantQuizAnswer>
    ;(vm as unknown as { beginAnswerEditing: () => void }).beginAnswerEditing()
    ;(vm as unknown as { selectedChoice: 'C' }).selectedChoice = 'C'
    await (vm as unknown as { submitAnswer: () => Promise<void> }).submitAnswer()

    expect((vm as unknown as { isEditingAnswer: boolean }).isEditingAnswer).toBe(true)
    expect((vm as unknown as { myAnswer: { choice: string } }).myAnswer.choice).toBe('B')
    expect((vm as unknown as { selectedChoice: string }).selectedChoice).toBe('C')
    wrapper.unmount()
  })

  it('解答POST成功後に遅れて返る同一問題のpollで受付済み表示を戻さない', async () => {
    vi.useFakeTimers()
    const stalePoll = deferred<ParticipantQuizState>()
    mockedFetchState
      .mockResolvedValueOnce(lowLockedState)
      .mockReturnValueOnce(stalePoll.promise)
    mockedSubmitAnswer.mockResolvedValueOnce({ my_answer: { choice: 'B', confidence_level: 'low' } })
    const wrapper = mount(Harness)
    await flushPromises()

    const vm = wrapper.vm as unknown as ReturnType<typeof useParticipantQuizAnswer>
    ;(vm as unknown as { selectedChoice: 'B' }).selectedChoice = 'B'
    await vi.advanceTimersByTimeAsync(5_000)
    await (vm as unknown as { submitAnswer: () => Promise<void> }).submitAnswer()

    expect((vm as unknown as { screen: string }).screen).toBe('submitted')
    expect((vm as unknown as { myAnswer: { choice: string } }).myAnswer.choice).toBe('B')

    stalePoll.resolve({ ...lowLockedState, answered: false, my_answer: null })
    await flushPromises()

    expect((vm as unknown as { screen: string }).screen).toBe('submitted')
    expect((vm as unknown as { myAnswer: { choice: string } }).myAnswer.choice).toBe('B')
    wrapper.unmount()
  })

  it('自信度POST成功後に遅れて返る同一問題のpollでlockを戻さずpendingを消す', async () => {
    vi.useFakeTimers()
    const stalePoll = deferred<ParticipantQuizState>()
    const normalLockedState: ParticipantQuizState = {
      ...unlockedState,
      confidence_level: 'high',
      confidence_locked: true,
    }
    mockedFetchState
      .mockResolvedValueOnce(unlockedState)
      .mockReturnValueOnce(stalePoll.promise)
    mockedConfirmConfidence.mockResolvedValueOnce(normalLockedState)
    const wrapper = mount(Harness)
    await flushPromises()

    const vm = wrapper.vm as unknown as ReturnType<typeof useParticipantQuizAnswer>
    await vi.advanceTimersByTimeAsync(5_000)
    ;(vm as unknown as { selectConfidenceLevel: (level: 'high') => void }).selectConfidenceLevel('high')
    expect((vm as unknown as { pendingConfidenceLevel: string }).pendingConfidenceLevel).toBe('high')
    await flushPromises()

    expect((vm as unknown as { isConfidenceLocked: boolean }).isConfidenceLocked).toBe(true)
    expect((vm as unknown as { lockedConfidenceLevel: string }).lockedConfidenceLevel).toBe('high')
    expect((vm as unknown as { pendingConfidenceLevel: string | undefined }).pendingConfidenceLevel).toBeUndefined()

    stalePoll.resolve(unlockedState)
    await flushPromises()

    expect((vm as unknown as { isConfidenceLocked: boolean }).isConfidenceLocked).toBe(true)
    expect((vm as unknown as { lockedConfidenceLevel: string }).lockedConfidenceLevel).toBe('high')
    wrapper.unmount()
  })

  it('mutation中でもphaseが変わったpollは反映する', async () => {
    vi.useFakeTimers()
    const stalePoll = deferred<ParticipantQuizState>()
    mockedFetchState
      .mockResolvedValueOnce(lowLockedState)
      .mockReturnValueOnce(stalePoll.promise)
    mockedSubmitAnswer.mockResolvedValueOnce({ my_answer: { choice: 'B', confidence_level: 'low' } })
    const wrapper = mount(Harness)
    await flushPromises()

    const vm = wrapper.vm as unknown as ReturnType<typeof useParticipantQuizAnswer>
    ;(vm as unknown as { selectedChoice: 'B' }).selectedChoice = 'B'
    await vi.advanceTimersByTimeAsync(5_000)
    const submitPromise = (vm as unknown as { submitAnswer: () => Promise<void> }).submitAnswer()
    stalePoll.resolve({ ...lowLockedState, phase: 'closed' })
    await flushPromises()
    await submitPromise

    expect((vm as unknown as { screen: string }).screen).toBe('closed')
    wrapper.unmount()
  })

  it('mutation中でもquestionが変わったpollは反映する', async () => {
    vi.useFakeTimers()
    const stalePoll = deferred<ParticipantQuizState>()
    const nextQuestionState: ParticipantQuizState = {
      ...unlockedState,
      question: { ...unlockedState.question!, question_id: 13 },
    }
    mockedFetchState
      .mockResolvedValueOnce(lowLockedState)
      .mockReturnValueOnce(stalePoll.promise)
    mockedSubmitAnswer.mockResolvedValueOnce({ my_answer: { choice: 'B', confidence_level: 'low' } })
    const wrapper = mount(Harness)
    await flushPromises()

    const vm = wrapper.vm as unknown as ReturnType<typeof useParticipantQuizAnswer>
    ;(vm as unknown as { selectedChoice: 'B' }).selectedChoice = 'B'
    await vi.advanceTimersByTimeAsync(5_000)
    const submitPromise = (vm as unknown as { submitAnswer: () => Promise<void> }).submitAnswer()
    stalePoll.resolve(nextQuestionState)
    await flushPromises()
    await submitPromise

    expect((vm as unknown as { question: { question_id: number } }).question.question_id).toBe(13)
    wrapper.unmount()
  })

  it('自信度POST失敗時はpendingを消して再試行可能に戻す', async () => {
    mockedConfirmConfidence.mockRejectedValueOnce(new Error('offline'))
    const wrapper = mount(Harness)
    await flushPromises()

    const vm = wrapper.vm as unknown as ReturnType<typeof useParticipantQuizAnswer>
    ;(vm as unknown as { selectConfidenceLevel: (level: 'high') => void }).selectConfidenceLevel('high')
    await flushPromises()

    expect((vm as unknown as { pendingConfidenceLevel: string | undefined }).pendingConfidenceLevel).toBeUndefined()
    expect((vm as unknown as { isConfirmingConfidence: boolean }).isConfirmingConfidence).toBe(false)
    expect((vm as unknown as { confidenceMessage: string }).confidenceMessage).toContain('自信度を確定できませんでした')
    wrapper.unmount()
  })
})
