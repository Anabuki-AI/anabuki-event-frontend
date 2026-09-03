import type { RegistrationRequest, RegistrationResponse } from '../types'
import { toApiError } from '~/lib/api/error'
import { request } from '~/lib/api/client'

// TODO: 実API(アンケート項目を保存する登録API)接続後に以下のモック実装を削除する
const MOCK_LATENCY_MS = 400

export async function createRegistration(input: RegistrationRequest): Promise<RegistrationResponse> {
  try {
    return await request<RegistrationResponse>('/users', {
      method: 'POST',
      body: input,
    })
  }
  catch (error) {
    const apiError = toApiError(error)
    // サーバが応答した4xx/5xxは握りつぶさずそのまま伝える
    if (apiError.statusCode !== undefined) {
      throw apiError
    }
    // 接続系エラー(バックエンド未起動等)のみモックで成功させる
    console.warn('[registration] registration APIに接続できないためモックを使用します', error)
    await new Promise(resolve => setTimeout(resolve, MOCK_LATENCY_MS))
    return { id: 0, userName: input.userName }
  }
}
