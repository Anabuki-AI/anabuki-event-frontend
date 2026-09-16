import type { AccessRequestStatus } from './types'
export { formatJapanDateTime as formatAdminDate } from '~/lib/format/datetime'

export const adminWorkflowSteps = ['ログイン', '利用申請', '運営開始'] as const

interface AccessRequestStateCopy {
  label: string
  title: string
  description: string
}

const initialAccessRequestCopy: AccessRequestStateCopy = {
  label: '本人確認済み',
  title: '管理者に利用を申請しましょう。',
  description:
    'Google アカウントを確認できました。はじめて利用する方は、管理者の承認が必要です。',
}

const accessRequestCopyByStatus = {
  PENDING: {
    label: '承認待ち',
    title: 'あと一歩。承認をお待ちください。',
    description:
      '利用申請を受け付けました。運営担当の管理者へ、下の申請番号とメールアドレスを伝えてください。',
  },
  APPROVED: {
    label: '承認済み',
    title: '準備が整いました。',
    description:
      '管理者から利用が承認されました。このブラウザで管理セッションに切り替えて、管理ポータルへ進んでください。',
  },
  REJECTED: {
    label: '申請が却下されました',
    title: '運営担当者へご確認ください。',
    description:
      '今回の申請は承認されませんでした。必要な権限について管理者に確認したうえで、再申請できます。',
  },
  CANCELLED: {
    label: '申請が取り消されました',
    title: 'もう一度、ログインから。',
    description:
      '有効期限切れやログイン状態の変更により、この申請は無効になりました。ログアウトして、再度 Google でログインしてください。',
  },
} satisfies Record<AccessRequestStatus, AccessRequestStateCopy>

export function getAccessRequestStateCopy(status: AccessRequestStatus | undefined) {
  return status ? accessRequestCopyByStatus[status] : initialAccessRequestCopy
}
