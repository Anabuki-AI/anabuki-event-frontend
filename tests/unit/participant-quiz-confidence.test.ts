import { mount } from '@vue/test-utils'
import { defineComponent, nextTick } from 'vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  fetchParticipantQuizState,
  submitParticipantQuizAnswer,
} from '~/features/participant-quiz/api/client'
import { useParticipantQuizAnswer } from '~/features/participant-quiz/composables/use-participant-quiz-answer'
import type { ParticipantQuizState } from '~/features/participant-quiz/types'

vi.mock('~/features/participant-quiz/api/client', () => ({
  fetchParticipantQuizState: vi.fn(),
  submitParticipantQuizAnswer: vi.fn(),
}))

const mockedFetchState = vi.mocked(fetchParticipantQuizState)
const mockedSubmitAnswer = vi.mocked(submitParticipantQuizAnswer)
const state: ParticipantQuizState = {
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
  confidence_multipliers: { high: 2, normal: 1, low: 0.5 },
}

const Harness = defineComponent({
  setup: () => useParticipantQuizAnswer({ onWaiting: vi.fn(), onUnauthorized: vi.fn() }),
  template: '<div />',
})

async function flushPromises() {
  await Promise.resolve()
  await nextTick()
}

describe('参加者クイズの自信度表示', () => {
  beforeEach(() => {
    mockedFetchState.mockReset().mockResolvedValue(state)
    mockedSubmitAnswer.mockReset()
  })

  it('APIの文字列levelと実倍率をそのまま表示する', async () => {
    const wrapper = mount(Harness)
    await flushPromises()

    const vm = wrapper.vm as unknown as ReturnType<typeof useParticipantQuizAnswer>
    expect((vm as unknown as { confidenceOptions: unknown }).confidenceOptions).toEqual([
      { value: 'high', label: 'あり', multiplier: '×2.00' },
      { value: 'normal', label: '普通', multiplier: '×1.00' },
      { value: 'low', label: 'なし', multiplier: '×0.50' },
    ])
    expect((vm as unknown as { selectedMultiplier: string }).selectedMultiplier).toBe('×1.00')
    wrapper.unmount()
  })
})
