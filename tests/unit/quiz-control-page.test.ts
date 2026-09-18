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

function mountQuizControlPage(timeLimitSeconds: number | null | undefined, phase: 'PUBLISHED' | 'CLOSING' = 'PUBLISHED', acting = false, resetOperation: Record<string, unknown> | null = null) {
  vi.mocked(useQuizClock).mockReturnValue({ now: ref(new Date('2026-09-18T10:00:00Z')) })
  const closeImmediately = vi.fn()
  const reset = vi.fn().mockResolvedValue(true)
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
    isActing: ref(acting),
    errorMessage: ref(''),
    noticeMessage: ref(''),
    resetOperation: ref(resetOperation),
    phase: ref(phase),
    phaseLabel: ref('解答受付中'),
    refresh: vi.fn(),
    start: vi.fn(),
    publish: vi.fn(),
    close: vi.fn(),
    closeImmediately,
    reveal: vi.fn(),
    finish: vi.fn(),
    reset,
  } as never)

  const wrapper = shallowMount(QuizControlPage, {
    global: {
      stubs: {
        NuxtLink: NuxtLinkStub,
      },
    },
  })

  return { wrapper, closeImmediately, reset }
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

  it('すべての確認画面で参加者データが永久削除されることを明示し、RESET不一致ではAPIを呼ばない', async () => {
    const { wrapper, reset } = mountQuizControlPage(60)
    const deletionWarning = '参加者登録情報（プロフィール）、参加者セッション、リアクション、回答、自信度選択、問題の公開履歴は永久に削除され、元に戻せません。'

    await wrapper.find('.quiz-reset-button').trigger('click')
    expect(wrapper.find('[role="dialog"]').text()).toContain(deletionWarning)
    await wrapper.find('.quiz-reset-cancel-button').trigger('click')
    expect(wrapper.find('[role="dialog"]').exists()).toBe(false)

    await wrapper.find('.quiz-reset-button').trigger('click')
    await wrapper.get('.quiz-reset-danger-button').trigger('click')
    expect(wrapper.find('[role="dialog"]').text()).toContain(deletionWarning)
    const input = wrapper.get('#quiz-reset-confirmation')
    await input.setValue('reset')
    const submit = wrapper.get('button[type="submit"]')
    expect(submit.attributes('disabled')).toBeDefined()
    await submit.trigger('click')
    expect(reset).not.toHaveBeenCalled()

    await input.setValue('RESET')
    expect(submit.attributes('disabled')).toBeUndefined()
    await wrapper.get('form').trigger('submit')
    expect(reset).toHaveBeenCalledWith('RESET')
    wrapper.unmount()
  })

  it('成功したリセットの受付票を操作IDと件数付きで表示する', () => {
    const { wrapper } = mountQuizControlPage(60, 'PUBLISHED', false, {
      operation_id: 'operation-1',
      affected_rows: {
        participants: 50,
        participant_sessions: 50,
        participant_reactions: 45,
        participant_answers: 300,
        confidence_selections: 300,
        question_reveals: 12,
        quiz_sessions: 1,
      },
    })

    const receipt = wrapper.find('.quiz-reset-receipt')
    expect(receipt.text()).toContain('操作ID: operation-1')
    expect(receipt.text()).toContain('参加者登録情報（プロフィール）50件')
    expect(receipt.text()).toContain('参加者セッション50件')
    expect(receipt.text()).toContain('リアクション45件')
    expect(receipt.text()).toContain('回答300件')
    expect(receipt.text()).toContain('自信度選択300件')
    wrapper.unmount()
  })

  it('進行操作中はリセット開始ボタンと確認操作を無効化する', async () => {
    const { wrapper, reset } = mountQuizControlPage(60, 'PUBLISHED', true)

    const resetButton = wrapper.get('.quiz-reset-button')
    expect(resetButton.attributes('disabled')).toBeDefined()
    await resetButton.trigger('click')
    expect(wrapper.find('[role="dialog"]').exists()).toBe(false)
    expect(reset).not.toHaveBeenCalled()
    wrapper.unmount()
  })
})
