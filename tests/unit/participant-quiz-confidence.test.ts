import { mount } from '@vue/test-utils'
import { defineComponent, nextTick } from 'vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
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

const Harness = defineComponent({
  setup: () => useParticipantQuizAnswer({ onWaiting: vi.fn(), onUnauthorized: vi.fn() }),
  template: '<div />',
})

async function flushPromises() {
  await Promise.resolve()
  await nextTick()
}

describe('参加者クイズのレベル確定', () => {
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
})
