import { mount } from '@vue/test-utils'
import { ref } from 'vue'
import { describe, expect, it, vi } from 'vitest'
import ProjectorPage from '../../app/pages/event_operator/projector.vue'
import { useProjectorQuiz } from '~/features/projector/use-projector-quiz'
import { useProjectorRanking } from '~/features/projector/use-projector-ranking'
import { useFloatingReactions } from '~/features/projector/use-floating-reactions'
import type { OperatorQuizState } from '~/features/quiz-control/types'
import type { RankingEntry } from '~/features/rankings/types'

vi.stubGlobal('useSeoMeta', vi.fn())
vi.mock('~/features/projector/use-projector-quiz', () => ({ useProjectorQuiz: vi.fn() }))
vi.mock('~/features/projector/use-projector-ranking', () => ({ useProjectorRanking: vi.fn() }))
vi.mock('~/features/projector/use-floating-reactions', () => ({ useFloatingReactions: vi.fn() }))

function mockQuiz(state: OperatorQuizState | null, phase: 'IDLE' | 'FINISHED' | 'REVEALED') {
  vi.mocked(useProjectorQuiz).mockReturnValue({
    state: ref(state),
    phase: ref(phase),
    isLoading: ref(false),
    errorMessage: ref(''),
    isAnswerVisible: ref(phase === 'REVEALED' || phase === 'FINISHED'),
    refresh: vi.fn(),
  } as never)
}

function mockRanking(topTen: RankingEntry[], errorMessage = '') {
  vi.mocked(useProjectorRanking).mockReturnValue({
    topTen: ref(topTen),
    isLoading: ref(false),
    errorMessage: ref(errorMessage),
  } as never)
}

function makeEntry(rank: number): RankingEntry {
  return { rank, participantId: `p${rank}`, displayName: `参加者${rank}`, totalPoints: 100 - rank }
}

describe('大画面(projector)の最終結果表示', () => {
  it('大会終了かつ次問題なしで、旧メッセージの代わりに1〜10位のランキングを表示する', () => {
    mockQuiz({ status: 'finished', phase: null, current: null, question_count: 3, total_participants: 5 }, 'FINISHED')
    mockRanking(Array.from({ length: 10 }, (_unused, i) => makeEntry(i + 1)))
    vi.mocked(useFloatingReactions).mockReturnValue({ floaters: ref([]), remove: vi.fn() } as never)

    const wrapper = mount(ProjectorPage)

    expect(wrapper.text()).not.toContain('クイズ大会は終了しました')
    expect(wrapper.find('.projector-ranking-title').text()).toBe('最終結果')
    const items = wrapper.findAll('.projector-ranking-item')
    expect(items).toHaveLength(10)
    expect(items[0]!.find('.projector-ranking-rank').text()).toBe('1位')
    expect(items[0]!.find('.projector-ranking-name').text()).toBe('参加者1')
    expect(items[0]!.find('.projector-ranking-points').text()).toBe('99点')
    expect(items[0]!.classes()).toContain('is-top')
    expect(items[9]!.classes()).not.toContain('is-top')
    wrapper.unmount()
  })

  it('ランキング取得前後で取得中/取得失敗のメッセージを出し分ける', () => {
    mockQuiz({ status: 'finished', phase: null, current: null, question_count: 3, total_participants: 5 }, 'FINISHED')
    vi.mocked(useFloatingReactions).mockReturnValue({ floaters: ref([]), remove: vi.fn() } as never)

    mockRanking([])
    const loading = mount(ProjectorPage)
    expect(loading.find('.projector-ranking-empty').text()).toBe('ランキングを集計しています…')
    loading.unmount()

    mockRanking([], '通信に失敗しました')
    const failed = mount(ProjectorPage)
    expect(failed.find('.projector-ranking-empty').text()).toBe('ランキングを取得できませんでした')
    failed.unmount()
  })

  it('大会終了でも最終問題が残っている間は、従来どおり問題と正解を表示する(ランキングにしない)', () => {
    mockQuiz({
      status: 'finished',
      phase: 'revealed',
      current: {
        question_id: 1,
        position: 3,
        question_text: '最終問題',
        choices: { A: 'a', B: 'b', C: 'c', D: 'd' },
        image_url: null,
        correct_answer: 'A',
        answered_count: 1,
        answered_rate: 1,
      },
      question_count: 3,
      total_participants: 5,
    }, 'FINISHED')
    mockRanking([])
    vi.mocked(useFloatingReactions).mockReturnValue({ floaters: ref([]), remove: vi.fn() } as never)

    const wrapper = mount(ProjectorPage)

    expect(wrapper.find('.projector-ranking').exists()).toBe(false)
    expect(wrapper.text()).toContain('最終問題')
    wrapper.unmount()
  })
})
