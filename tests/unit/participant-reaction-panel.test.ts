import { readFileSync } from 'node:fs'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { computed, nextTick, ref } from 'vue'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import ParticipantReactionPanel from '~/features/participants/components/ParticipantReactionPanel.vue'
import ParticipantReactionHost from '~/features/participants/components/ParticipantReactionHost.vue'
import { allowsParticipantReactions } from '~/features/participants/composables/use-reaction-session'
import { reportParticipantReaction } from '~/features/participants/api/report-reaction'
import { getCurrentParticipant } from '~/features/participants/api/get-current-participant'
import type { Participant } from '~/features/participants/types'
import { ApiError } from '~/lib/api/error'

vi.mock('~/features/participants/api/report-reaction', () => ({ reportParticipantReaction: vi.fn() }))
vi.mock('~/features/participants/api/get-current-participant', () => ({ getCurrentParticipant: vi.fn() }))
const report = vi.mocked(reportParticipantReaction)
const getParticipant = vi.mocked(getCurrentParticipant)
const participant = { id: 'participant-1', displayName: '参加者' } as unknown as Participant
const route = ref({ path: '/' })
let wrapper: VueWrapper | undefined

beforeEach(() => {
  report.mockReset().mockResolvedValue(undefined)
  getParticipant.mockReset().mockResolvedValue(participant)
  route.value = { path: '/' }
  vi.stubGlobal('useRouter', () => ({ currentRoute: computed(() => route.value) }))
})
afterEach(() => {
  wrapper?.unmount()
  wrapper = undefined
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((done) => { resolve = done })
  return { promise, resolve }
}

describe('participant reaction route allowlist', () => {
  it.each(['/', '/help', '/rankings', '/participants/waiting', '/participants/edit', '/participants/help', '/participants/help/', '/users/answer', '/users/answer/'])('allows %s', (path) => {
    expect(allowsParticipantReactions(path)).toBe(true)
  })
  it.each(['/participants/new', '/admin', '/operator', '/event_operator/projector', '/unknown', '/participants/waiting/extra'])('excludes %s', (path) => {
    expect(allowsParticipantReactions(path)).toBe(false)
  })
  it('checks the answer page session and shows the panel for a signed-in participant', async () => {
    route.value.path = '/users/answer'
    wrapper = mount(ParticipantReactionHost)
    await flushPromises()
    expect(getParticipant).toHaveBeenCalledTimes(1)
    expect(wrapper.find('aside').exists()).toBe(true)
  })
})

describe('participant reaction session', () => {
  it('hides while checking and shows exactly one panel once confirmed', async () => {
    const check = deferred<Participant>()
    getParticipant.mockReturnValueOnce(check.promise)
    wrapper = mount(ParticipantReactionHost)
    expect(wrapper.find('aside').exists()).toBe(false)
    check.resolve(participant)
    await flushPromises()
    expect(wrapper.findAll('aside')).toHaveLength(1)
  })
  it.each([new ApiError('Unauthorized', 401), new Error('offline')])('hides on failure without navigation', async (error) => {
    getParticipant.mockRejectedValueOnce(error)
    const navigate = vi.fn()
    vi.stubGlobal('navigateTo', navigate)
    wrapper = mount(ParticipantReactionHost)
    await flushPromises()
    expect(wrapper.find('aside').exists()).toBe(false)
    expect(navigate).not.toHaveBeenCalled()
  })
  it('ignores an old success after navigating away and back; rechecks after registration', async () => {
    const old = deferred<Participant>()
    const fresh = deferred<Participant>()
    getParticipant.mockReturnValueOnce(old.promise).mockReturnValueOnce(fresh.promise)
    wrapper = mount(ParticipantReactionHost)
    route.value.path = '/participants/new'
    await nextTick()
    route.value.path = '/'
    await nextTick()
    old.resolve(participant)
    await flushPromises()
    expect(wrapper.find('aside').exists()).toBe(false)
    fresh.resolve(participant)
    await flushPromises()
    expect(wrapper.find('aside').exists()).toBe(true)
    route.value.path = '/users/answer'
    await nextTick()
    await flushPromises()
    expect(wrapper.find('aside').exists()).toBe(true)
  })
  it('rechecks between allowed routes and resets the expanded panel', async () => {
    wrapper = mount(ParticipantReactionHost)
    await flushPromises()
    await wrapper.get('.stamp-toggle').trigger('click')
    const check = deferred<Participant>()
    getParticipant.mockReturnValueOnce(check.promise)
    route.value.path = '/rankings'
    await nextTick()
    expect(wrapper.find('aside').exists()).toBe(false)
    check.resolve(participant)
    await flushPromises()
    expect(wrapper.get('.stamp-toggle').attributes('aria-expanded')).toBe('false')
  })
  it('discards a check completing after the host unmounts', async () => {
    const check = deferred<Participant>()
    getParticipant.mockReturnValueOnce(check.promise)
    wrapper = mount(ParticipantReactionHost)
    wrapper.unmount()
    wrapper = undefined
    check.resolve(participant)
    await flushPromises()
    window.dispatchEvent(new Event('focus'))
    expect(getParticipant).toHaveBeenCalledTimes(1)
  })
  it('invalidates a confirmed session on refocus and a failed check', async () => {
    wrapper = mount(ParticipantReactionHost)
    await flushPromises()
    getParticipant.mockRejectedValueOnce(new Error('expired'))
    window.dispatchEvent(new Event('focus'))
    await flushPromises()
    expect(wrapper.find('aside').exists()).toBe(false)
  })
  it('removes the host on send 401', async () => {
    wrapper = mount(ParticipantReactionHost)
    await flushPromises()
    await wrapper.get('.stamp-toggle').trigger('click')
    report.mockRejectedValueOnce(new ApiError('Unauthorized', 401))
    await wrapper.get('.stamp-button').trigger('click')
    await flushPromises()
    expect(wrapper.find('aside').exists()).toBe(false)
  })
  it('has only a global host, not a duplicated waiting-page reaction bar', () => {
    const waiting = readFileSync('app/pages/participants/waiting.vue', 'utf8')
    expect(waiting).not.toMatch(/reactionOptions|handleReact|ParticipantReaction/)
    const app = readFileSync('app/app.vue', 'utf8')
    expect(app.match(/<ParticipantReactionHost/g)).toHaveLength(1)
  })
})

describe('participant reaction panel', () => {
  it('opens eight labeled buttons, closes with Escape and restores toggle focus', async () => {
    wrapper = mount(ParticipantReactionPanel, { attachTo: document.body })
    expect(wrapper.findAll('.stamp-button')).toHaveLength(0)
    await wrapper.get('.stamp-toggle').trigger('click')
    expect(wrapper.get('.stamp-toggle').attributes('aria-expanded')).toBe('true')
    expect(wrapper.findAll('.stamp-button')).toHaveLength(8)
    expect(wrapper.findAll('.stamp-button').every(button => button.attributes('aria-label'))).toBe(true)
    await wrapper.get('.stamp-button').trigger('keydown', { key: 'Escape' })
    expect(wrapper.findAll('.stamp-button')).toHaveLength(0)
    expect(document.activeElement).toBe(wrapper.get('.stamp-toggle').element)
  })
  it('sends every rapid click, even the same stamp, without delaying local feedback', async () => {
    vi.useFakeTimers()
    wrapper = mount(ParticipantReactionPanel)
    await wrapper.get('.stamp-toggle').trigger('click')
    const buttons = wrapper.findAll('.stamp-button')
    await buttons[0]!.trigger('click')
    await buttons[0]!.trigger('click')
    await buttons[1]!.trigger('click')
    expect(report).toHaveBeenCalledTimes(3)
    expect(report).toHaveBeenNthCalledWith(1, { reaction: '👏' })
    expect(report).toHaveBeenNthCalledWith(2, { reaction: '👏' })
    expect(report).toHaveBeenNthCalledWith(3, { reaction: '🎉' })
    expect(buttons[1]!.classes()).toContain('is-reacted')
    await vi.advanceTimersByTimeAsync(500)
    expect(buttons[1]!.classes()).not.toContain('is-reacted')
  })
  it('retains local feedback when rate limited', async () => {
    vi.useFakeTimers()
    report.mockRejectedValueOnce(new Error('429 Too Many Requests'))
    wrapper = mount(ParticipantReactionPanel)
    await wrapper.get('.stamp-toggle').trigger('click')
    await wrapper.get('.stamp-button').trigger('click')
    await flushPromises()
    expect(wrapper.get('.stamp-button').classes()).toContain('is-reacted')
    await vi.advanceTimersByTimeAsync(500)
    expect(wrapper.get('.stamp-button').classes()).not.toContain('is-reacted')
  })
  it('hides and closes while a text field is focused', async () => {
    wrapper = mount(ParticipantReactionPanel, { attachTo: document.body })
    await wrapper.get('.stamp-toggle').trigger('click')
    const input = document.createElement('input')
    document.body.append(input)
    input.focus()
    await nextTick()
    expect(wrapper.get('.reaction-space').isVisible()).toBe(false)
    input.blur()
    await nextTick()
    expect(wrapper.get('.reaction-space').isVisible()).toBe(true)
    expect(wrapper.findAll('.stamp-button')).toHaveLength(0)
    input.remove()
  })
})
