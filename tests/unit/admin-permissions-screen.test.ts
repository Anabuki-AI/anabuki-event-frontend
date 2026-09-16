import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

describe('/admin/permissions の権限シート', () => {
  const source = readFileSync(join(process.cwd(), 'app/admin/components/AdminConsole.vue'), 'utf8')

  it('管理者とオペレーターを別タブで表示する', () => {
    expect(source).toContain("permissionTab === 'admin'")
    expect(source).toContain("permissionTab === 'operator'")
    expect(source).toContain('管理者一覧')
    expect(source).toContain('オペレーター一覧')
  })

  it('operator申請の承認導線を持たず、直接権限を変更する', () => {
    expect(source).not.toContain('pendingOperatorRequests')
    expect(source).not.toContain('decideOperatorRequest')
    expect(source).not.toContain('オペレーターの利用申請')
    expect(source).toContain('setOperatorAccess(account.id, !account.managerEnabled)')
  })
})
