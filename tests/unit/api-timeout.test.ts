import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { GET_TIMEOUT_MS, request } from '../../app/lib/api/client'

const mockedFetch = vi.fn()

describe('共通API requestのGET timeout契約', () => {
  beforeEach(() => {
    vi.stubGlobal('useRuntimeConfig', () => ({ public: { apiBase: '/api' } }))
    vi.stubGlobal('$fetch', mockedFetch)
    mockedFetch.mockReset()
    mockedFetch.mockResolvedValue({ ok: true })
  })

  afterEach(() => vi.unstubAllGlobals())

  it('GETには20秒timeoutとリトライ無効を渡す', async () => {
    await request('/questions')

    expect(mockedFetch).toHaveBeenCalledWith('/questions', expect.objectContaining({
      baseURL: '/api',
      credentials: 'include',
      timeout: GET_TIMEOUT_MS,
      retry: 0,
    }))
  })

  it('POSTにはGET用timeoutとリトライ設定を追加しない', async () => {
    await request('/answers', { method: 'POST', body: { choice: 'A' } })

    const options = mockedFetch.mock.calls[0]?.[1] as Record<string, unknown>
    expect(options).not.toHaveProperty('timeout')
    expect(options).not.toHaveProperty('retry')
  })

  it('timeoutエラーを既存のApiError経路へ変換する', async () => {
    mockedFetch.mockRejectedValueOnce(new Error(`timeout of ${GET_TIMEOUT_MS}ms exceeded`))

    await expect(request('/questions')).rejects.toMatchObject({
      name: 'ApiError',
      message: `timeout of ${GET_TIMEOUT_MS}ms exceeded`,
    })
  })
})
