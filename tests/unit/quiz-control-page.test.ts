import { shallowMount } from '@vue/test-utils'
import { ref } from 'vue'
import { describe, expect, it, vi } from 'vitest'
import QuizControlPage from '../../app/pages/event_operator/quiz-control.vue'
import QuizTimerPanel from '../../app/features/quiz-control/components/QuizTimerPanel.vue'
import { useQuizClock } from '~/features/quiz-control/useQuizClock'
import { useQuizControl } from '~/features/quiz-control/useQuizControl'

vi.mock('~/features/quiz-control/useQuizClock', () => ({
  useQuizClock: vi.fn(),
}))
vi.mock('~/features/quiz-control/useQuizControl', () => ({
  useQuizControl: vi.fn(),
}))
vi.stubGlobal('useSeoMeta', vi.fn())

const NuxtLinkStub = {
  name: 'NuxtLink',
  props: {
    to: { type: String, required: true },
  },
  template: '<a :href="to"><slot /></a>',
}

function mountQuizControlPage(timeLimitSeconds: number | null | undefined, phase: 'PUBLISHED' | 'CLOSING' = 'PUBLISHED') {
  vi.mocked(useQuizClock).mockReturnValue({ now: ref(new Date('2026-09-18T10:00:00Z')) })
  const closeImmediately = vi.fn()
  vi.mocked(useQuizControl).mockReturnValue({
    state: ref({
      status: 'in_progress',
      phase: phase === 'PUBLISHED' ? 'answering' : 'closing',
      current: {
        question_id: 1,
        position: 1,
        question_text: '問題',
        choices: { A: 'A', B: 'B', C: 'C', D: 'D' },
        image_url: null,
        correct_answer: 'A',
        answered_count: 0,
        answered_rate: 0,
        time_limit_seconds: timeLimitSeconds,
      },
      question_count: 1,
      total_participants: 0,
      phase_started_at: '2026-09-18T10:00:00Z',
      finished_elapsed_seconds: null,
      next_question: null,
    }),
    history: ref([]),
    isLoading: ref(false),
    isActing: ref(false),
    errorMessage: ref(''),
    noticeMessage: ref(''),
    phase: ref(phase),
    phaseLabel: ref('解答受付中'),
    refresh: vi.fn(),
    start: vi.fn(),
    publish: vi.fn(),
    close: vi.fn(),
    closeImmediately,
    reveal: vi.fn(),
    finish: vi.fn(),
  } as never)

  const wrapper = shallowMount(QuizControlPage, {
    global: {
      stubs: {
        NuxtLink: NuxtLinkStub,
      },
    },
  })

  return { wrapper, closeImmediately }
}

describe('クイズ出題管理画面の問題別制限時間', () => {
  it.each([60, null, undefined])('サーバーが返した制限時間 %s をタイマーパネルへ渡す', (timeLimitSeconds) => {
    const { wrapper } = mountQuizControlPage(timeLimitSeconds)

    expect(wrapper.findComponent(QuizTimerPanel).props('timeLimitSeconds')).toBe(timeLimitSeconds ?? null)
    wrapper.unmount()
  })

  it('期限切れイベントはPUBLISHEDの自動期限切れ契約だけを呼び出す', () => {
    const published = mountQuizControlPage(60, 'PUBLISHED')
    published.wrapper.findComponent(QuizTimerPanel).vm.$emit('expire')
    expect(published.closeImmediately).toHaveBeenCalledOnce()
    published.wrapper.unmount()

    const closing = mountQuizControlPage(60, 'CLOSING')
    closing.wrapper.findComponent(QuizTimerPanel).vm.$emit('expire')
    expect(closing.closeImmediately).not.toHaveBeenCalled()
    closing.wrapper.unmount()
  })
})
