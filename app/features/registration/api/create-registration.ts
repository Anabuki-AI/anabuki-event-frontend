import type { RegistrationRequest, RegistrationResponse } from '../types'
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
    // TODO: 実API(アンケート対応の登録API)接続後は、このフォールバックを削除し
    // 4xx/5xxのエラーを画面に表示する挙動に戻す
    console.warn('[registration] 登録APIが受け付けられないためモックを使用します', error)
    await new Promise(resolve => setTimeout(resolve, MOCK_LATENCY_MS))
    return { id: 0, userName: input.userName }
  }
}
