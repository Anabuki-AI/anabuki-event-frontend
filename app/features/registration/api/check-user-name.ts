import type { NicknameAvailability } from '../types'
import { request } from '~/lib/api/client'

// TODO: 実API(/api/usernames/available)接続後に以下のモック実装を削除する
const MOCK_TAKEN_USER_NAMES = ['taken', 'sample', 'test']
const MOCK_LATENCY_MS = 300

export async function checkUserName(userName: string): Promise<NicknameAvailability> {
  try {
    return await request<NicknameAvailability>('/usernames/available', {
      method: 'GET',
      query: { userName },
    })
  }
  catch (error) {
    // バックエンド未実装のため、接続できない場合はモックで応答する
    console.warn('[registration] availability APIに接続できないためモックを使用します', error)
    await new Promise(resolve => setTimeout(resolve, MOCK_LATENCY_MS))
    const available = !MOCK_TAKEN_USER_NAMES.includes(userName.toLowerCase())
    return {
      available,
      reason: available ? null : 'このユーザーネームは既に使われています',
    }
  }
}
