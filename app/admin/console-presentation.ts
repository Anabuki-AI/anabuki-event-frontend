export const consolePages = [
  { key: 'home', path: '/admin', label: '管理者メイン', eyebrow: 'OVERVIEW', title: '大会を支える、管理の拠点。', description: 'アカウント、利用申請、システムの状態をここから確認できます。', icon: 'home' },
  { key: 'logs', path: '/admin/logs', label: 'ログ確認', eyebrow: 'ACTIVITY LOG', title: '運営の記録を、ひとつに。', description: '操作内容・実行ユーザー・日時を確認するための画面です。', icon: 'logs' },
  { key: 'status', path: '/admin/status', label: 'APIステータス', eyebrow: 'SYSTEM STATUS', title: 'システムの今を確認。', description: 'バックエンドへの疎通と、監視データの連携状況を確認できます。', icon: 'activity' },
  { key: 'permissions', path: '/admin/permissions', label: '権限付与', eyebrow: 'TEAM & ACCESS', title: '運営をともにする、チーム。', description: '管理者とオペレーターを分けて確認・管理できます。', icon: 'users' },
  { key: 'logout', path: '/admin/logout', label: 'ログアウト', eyebrow: 'YOUR ACCOUNT', title: '作業を終える前に。', description: 'ログイン中のアカウントを確認して、安全にログアウトできます。', icon: 'logout' },
] as const

export type ConsolePage = typeof consolePages[number]
export function getConsolePage(path: string): ConsolePage {
  return consolePages.find(page => page.path === path.replace(/\/$/, '')) ?? consolePages[0]
}

export function formatConsoleDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '日時を取得できません'
  return new Intl.DateTimeFormat('ja-JP', {
    month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', timeZone: 'Asia/Tokyo',
  }).format(date)
}

export function accessSourceLabel(source: 'ENVIRONMENT_ACCESS' | 'MANAGEMENT_ACCESS') {
  return source === 'ENVIRONMENT_ACCESS' ? '環境設定による付与' : '利用申請の承認による付与'
}
