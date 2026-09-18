import { flushPromises, mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { request } from '~/lib/api/client'
import ConfidenceMultiplierModal from '../../app/features/problems/components/ConfidenceMultiplierModal.vue'

vi.mock('~/lib/api/client', () => ({ request: vi.fn() }))

const mockedRequest = vi.mocked(request)
const response = { high: '2.00', normal: '1.00', low: '0.50' }

describe('自信度倍率モーダル', () => {
  beforeEach(() => mockedRequest.mockReset())

  it('親から渡された初期値を先に表示し、GETはバックグラウンドで再検証する', async () => {
    let resolveRefresh!: (value: typeof response) => void
    mockedRequest.mockReturnValue(new Promise(resolve => { resolveRefresh = resolve }))
    const initial = { high: '1.75', normal: '0.90', low: '0.25' }
    const wrapper = mount(ConfidenceMultiplierModal, { props: { initialMultipliers: initial } })
    await nextTick()

    expect((wrapper.findAll('input')[0]!.element as HTMLInputElement).value).toBe('1.75')
    expect((wrapper.findAll('input')[1]!.element as HTMLInputElement).value).toBe('0.90')
    expect(wrapper.find('.multiplier-refresh-status').text()).toContain('更新中')
    expect(mockedRequest).toHaveBeenCalledWith('/admin/confidence-multipliers', { credentials: 'include' })

    resolveRefresh(response)
    await flushPromises()
    expect((wrapper.findAll('input')[0]!.element as HTMLInputElement).value).toBe('2.00')
    expect(wrapper.find('.multiplier-refresh-status').exists()).toBe(false)
    wrapper.unmount()
  })

  it('文字列の倍率レスポンスを表示し、保存した文字列をemitする', async () => {
    mockedRequest
      .mockResolvedValueOnce(response)
      .mockResolvedValueOnce({ ...response, high: '1.50' })
    const wrapper = mount(ConfidenceMultiplierModal)
    await flushPromises()

    const inputs = wrapper.findAll('input')
    expect((inputs[0]!.element as HTMLInputElement).value).toBe('2.00')
    expect((inputs[1]!.element as HTMLInputElement).value).toBe('1.00')
    expect((inputs[2]!.element as HTMLInputElement).value).toBe('0.50')

    await inputs[0]!.setValue('1.50')
    await wrapper.findAll('.multiplier-modal-save')[0]!.trigger('click')
    await flushPromises()

    expect(mockedRequest).toHaveBeenLastCalledWith('/admin/confidence-multipliers/high', {
      method: 'PATCH', body: { confidenceMultiplier: 1.5 }, credentials: 'include',
    })
    expect(wrapper.emitted('updated')).toEqual([['high', '1.50']])
  })
})
