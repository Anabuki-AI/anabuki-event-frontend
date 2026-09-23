import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h } from 'vue'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import AuditLogPanel from '~/admin/components/AuditLogPanel.vue'
import { auditLogApi } from '~/admin/api/audit-logs'
import { useAuditLogs } from '~/admin/composables/useAuditLogs'
import { parseAuditLogPage } from '~/features/admin/audit-log-contract'
import { ApiError } from '~/lib/api/error'

vi.mock('~/admin/api/audit-logs', () => ({ auditLogApi: { page: vi.fn() } }))
const api = vi.mocked(auditLogApi)
let wrapper: VueWrapper
let state: ReturnType<typeof useAuditLogs>
const refreshSession = vi.fn<() => Promise<void>>()
const validEntry = {
  id: '42', type: 'QUESTION_CREATED', actorEmail: 'staff@example.test', actorGoogleSub: 'sub-1',
  targetType: 'QUESTION', targetId: '7', operationId: null, operationStartedAt: null, operationCompletedAt: null,
  detail: { level: 2 }, occurredAt: '2026-09-18T01:00:00+09:00',
}
function start(enabled = false) {
  wrapper = mount(defineComponent({ setup() { state = useAuditLogs(refreshSession, enabled); return () => h('div') } }))
  return state
}
function renderPanel(enabled = true) {
  const auditState = start(enabled)
  wrapper = mount(AuditLogPanel, { props: { state: auditState } })
  return auditState
}
beforeEach(() => { vi.resetAllMocks(); refreshSession.mockResolvedValue(undefined) })
afterEach(() => wrapper?.unmount())

describe('audit log contract parsing', () => {
  it('accepts a well-formed page without coercing anything', () => {
    const page = parseAuditLogPage({ entries: [validEntry], page: 1, perPage: 50, totalEntries: 1 })
    expect(page.entries[0]?.type).toBe('QUESTION_CREATED')
    expect(page.totalEntries).toBe(1)
  })
  it('accepts the backend tournament reset receipt fields', () => {
    const page = parseAuditLogPage({
      entries: [{
        ...validEntry,
        type: 'TOURNAMENT_RESET',
        targetType: 'TOURNAMENT',
        targetId: 'operation-1',
        operationId: 'operation-1',
        operationStartedAt: '2026-09-30T00:00:00.000000Z',
        operationCompletedAt: '2026-09-30T00:00:01.000000Z',
        detail: {
          participantsDeleted: 50,
          participantSessionsDeleted: 50,
          participantAnswersDeleted: 300,
          confidenceSelectionsDeleted: 300,
          questionRevealsReset: 12,
          quizSessionsReset: 1,
        },
      }],
      page: 1,
      perPage: 50,
      totalEntries: 1,
    })
    expect(page.entries[0]?.operationId).toBe('operation-1')
  })
  it('accepts the widened participant-activity and operator event types', () => {
    const page = parseAuditLogPage({
      entries: [
        { ...validEntry, type: 'ANSWER_SUBMITTED', detail: { participantId: 'p-1', questionId: 1, choice: 'A', confidenceLevel: 'high', awardedPoints: 20 } },
        { ...validEntry, type: 'OPERATOR_LOGGED_OUT', detail: {} },
      ],
      page: 1,
      perPage: 50,
      totalEntries: 2,
    })
    expect(page.entries.map(entry => entry.type)).toEqual(['ANSWER_SUBMITTED', 'OPERATOR_LOGGED_OUT'])
  })
  it('rejects unknown or malformed event data instead of dropping or labeling it', () => {
    expect(() => parseAuditLogPage({ entries: [{ ...validEntry, type: 'MYSTERY_EVENT' }], page: 1, perPage: 50, totalEntries: 1 })).toThrow()
    expect(() => parseAuditLogPage({ entries: [{ ...validEntry, occurredAt: 'not-a-date' }], page: 1, perPage: 50, totalEntries: 1 })).toThrow()
    expect(() => parseAuditLogPage({ entries: [{ ...validEntry, detail: { secret: { nested: true } } }], page: 1, perPage: 50, totalEntries: 1 })).toThrow()
    expect(() => parseAuditLogPage({ entries: [{ ...validEntry, type: 'TOURNAMENT_RESET', operationId: null }], page: 1, perPage: 50, totalEntries: 1 })).toThrow()
    expect(() => parseAuditLogPage({ entries: [validEntry], page: 0, perPage: 50, totalEntries: 1 })).toThrow()
  })
})

describe('audit log fetch boundaries', () => {
  it('makes no request while the feature flag is disabled', async () => {
    const disabled = start(false)
    await disabled.load()
    expect(api.page).not.toHaveBeenCalled()
    expect(disabled.loaded.value).toBe(false)
  })
  it('sends paging and filters as contract query parameters', async () => {
    api.page.mockResolvedValue({ entries: [], page: 1, perPage: 50, totalEntries: 0 })
    const enabled = start(true)
    enabled.applyFilters({ type: 'QUESTION_DELETED', from: '2026-09-18T00:00', to: '' })
    await flushPromises()
    const call = api.page.mock.calls[0]?.[0]
    expect(call?.page).toBe(1)
    expect(call?.perPage).toBe(50)
    expect(call?.types).toEqual(['QUESTION_DELETED'])
    expect(call?.from).toBe(new Date('2026-09-18T00:00').toISOString())
    expect(call?.to).toBeUndefined()
  })
  it('rejects an inverted date range locally without a request', async () => {
    const enabled = start(true)
    enabled.applyFilters({ type: 'ALL', from: '2026-09-19T00:00', to: '2026-09-18T00:00' })
    await flushPromises()
    expect(api.page).not.toHaveBeenCalled()
    expect(enabled.staleNotice.value).toContain('期間の指定が不正')
  })
  it('distinguishes an empty successful page from failures and session loss', async () => {
    api.page.mockResolvedValueOnce({ entries: [], page: 1, perPage: 50, totalEntries: 0 })
      .mockRejectedValueOnce(new ApiError('forbidden', 403))
      .mockRejectedValueOnce(new ApiError('expired', 401))
      .mockRejectedValueOnce(new Error('schema drift'))
    const enabled = start(true)
    await enabled.load()
    expect(enabled.loaded.value).toBe(true)
    expect(enabled.entries.value).toEqual([])
    expect(enabled.error.value).toBe('')
    await enabled.load()
    expect(enabled.error.value).toContain('権限がありません')
    expect(refreshSession).not.toHaveBeenCalled()
    await enabled.load()
    expect(enabled.error.value).toContain('再ログイン')
    expect(refreshSession).toHaveBeenCalledOnce()
    await enabled.load()
    expect(enabled.error.value).toContain('取得できません')
    expect(enabled.staleNotice.value).toBe('')
  })
  it('keeps previous results visible but marked stale on an invalid parameter (400)', async () => {
    api.page.mockResolvedValueOnce({ entries: [validEntry], page: 1, perPage: 50, totalEntries: 1 })
      .mockRejectedValueOnce(new ApiError('bad type', 400))
    const enabled = start(true)
    await enabled.load()
    expect(enabled.entries.value).toHaveLength(1)
    await enabled.load()
    expect(enabled.staleNotice.value).toContain('条件に不正な値')
    expect(enabled.entries.value).toHaveLength(1)
    expect(enabled.error.value).toBe('')
  })
})

describe('audit log panel presentation', () => {
  it('labels entries with Japanese operation names and honest pagination', async () => {
    api.page.mockResolvedValue({ entries: [validEntry], page: 1, perPage: 50, totalEntries: 51 })
    renderPanel(true)
    await state.load()
    await flushPromises()
    expect(wrapper.text()).toContain('問題の作成')
    expect(wrapper.text()).toContain('staff@example.test')
    expect(wrapper.text()).toContain('1–50 件 / 全 51 件')
    expect(wrapper.text()).not.toContain('MYSTERY')
  })
  it('renders the tournament reset label and receipt without exposing participant identity', async () => {
    api.page.mockResolvedValue({
      entries: [{
        ...validEntry,
        type: 'TOURNAMENT_RESET',
        targetType: 'TOURNAMENT',
        targetId: 'operation-1',
        operationId: 'operation-1',
        operationStartedAt: '2026-09-30T00:00:00.000000Z',
        operationCompletedAt: '2026-09-30T00:00:01.000000Z',
        detail: {
          participantsDeleted: 50,
          participantSessionsDeleted: 50,
          participantAnswersDeleted: 300,
          confidenceSelectionsDeleted: 300,
          questionRevealsReset: 12,
          quizSessionsReset: 1,
        },
      }],
      page: 1,
      perPage: 50,
      totalEntries: 1,
    })
    renderPanel(true)
    await state.load()
    await flushPromises()
    expect(wrapper.text()).toContain('クイズ大会のリセット')
    expect(wrapper.text()).toContain('operation-1')
    expect(wrapper.text()).toContain('参加者: 50件')
    expect(wrapper.text()).toContain('回答: 300件')
    expect(wrapper.text()).toContain('staff@example.test')
  })
  it('labels and summarizes the newly widened participant-activity and operator event types', async () => {
    api.page.mockResolvedValue({
      entries: [
        { ...validEntry, id: '1', type: 'PARTICIPANT_REGISTERED', actorEmail: null, targetType: 'PARTICIPANT', targetId: 'p-1', detail: { displayName: 'たろう', gender: 'male', ageGroup: '10s', studentType: 'student' } },
        { ...validEntry, id: '2', type: 'ANSWER_CHANGED', actorEmail: null, targetType: 'PARTICIPANT_ANSWER', targetId: 'a-1', detail: { participantId: 'p-1', questionId: 3, previousChoice: 'A', choice: 'B', previousConfidenceLevel: 'normal', confidenceLevel: 'high', previousAwardedPoints: 10, awardedPoints: 20 } },
        { ...validEntry, id: '3', type: 'CONFIDENCE_LEVEL_CHANGED', actorEmail: null, targetType: 'PARTICIPANT_QUIZ_CONFIDENCE_SELECTION', targetId: 'c-1', detail: { participantId: 'p-1', questionId: 3, previousConfidenceLevel: 'normal', confidenceLevel: 'high', eliminatedChoice: 'C' } },
        { ...validEntry, id: '4', type: 'ANSWER_WINDOW_CLOSED', targetType: 'QUESTION', targetId: '3', detail: { reason: 'time_limit_expired' } },
        { ...validEntry, id: '5', type: 'OPERATOR_LOGIN_SUCCEEDED', targetType: null, targetId: null, detail: {} },
      ],
      page: 1,
      perPage: 50,
      totalEntries: 5,
    })
    renderPanel(true)
    await state.load()
    await flushPromises()
    expect(wrapper.text()).toContain('参加者の登録')
    expect(wrapper.text()).toContain('表示名「たろう」で登録')
    expect(wrapper.text()).toContain('回答の変更')
    expect(wrapper.text()).toContain('問題3の回答をA→Bに変更（10点→20点）')
    expect(wrapper.text()).toContain('自信度の変更')
    expect(wrapper.text()).toContain('問題3の自信度を普通→ありに変更')
    expect(wrapper.text()).toContain('回答締切')
    expect(wrapper.text()).toContain('制限時間の経過')
    expect(wrapper.text()).toContain('運営ログイン成功')
    expect(wrapper.text()).toContain('（システム）')
  })
  it('never renders an empty page as proof that nothing ever happened', async () => {
    api.page.mockResolvedValue({ entries: [], page: 1, perPage: 50, totalEntries: 0 })
    renderPanel(true)
    await state.load()
    await flushPromises()
    expect(wrapper.text()).toContain('0 件')
    expect(wrapper.text()).toContain('将来の記録の有無を意味するものではありません')
  })
})
