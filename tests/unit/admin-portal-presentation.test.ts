import { describe, expect, it } from 'vitest'
import {
  adminWorkflowSteps,
  getAccessRequestStateCopy,
} from '~/features/admin/portal-presentation'
import type { AccessRequestStatus } from '~/features/admin/types'

const accessRequestStatuses = [
  ['PENDING', '承認待ち'],
  ['APPROVED', '承認済み'],
  ['REJECTED', '申請が却下されました'],
  ['CANCELLED', '申請が取り消されました'],
] as const satisfies ReadonlyArray<readonly [AccessRequestStatus, string]>

describe('admin portal presentation', () => {
  it('keeps the three-step workflow in the order shown to administrators', () => {
    expect(adminWorkflowSteps).toEqual(['ログイン', '利用申請', '運営開始'])
  })

  it.each(accessRequestStatuses)(
    'uses the correct copy for a %s access request',
    (status, label) => {
      expect(getAccessRequestStateCopy(status).label).toBe(label)
    })

  it('shows the application invitation before a request exists', () => {
    expect(getAccessRequestStateCopy(undefined)).toMatchObject({
      label: '本人確認済み',
      title: '管理者に利用を申請しましょう。',
    })
  })
})
