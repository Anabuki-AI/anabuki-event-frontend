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
    expect(source).toContain("setOperatorAccess(account.id, true)")
  })

  it('両方の権限タブをTabで到達可能にし、ARIA接続とキーボード操作を提供する', () => {
    expect(source).toContain('id="permission-tab-admin"')
    expect(source).toContain('id="permission-tab-operator"')
    expect(source).toContain('aria-controls="permission-panel-admin"')
    expect(source).toContain('aria-controls="permission-panel-operator"')
    expect(source).toContain('role="tabpanel"')
    expect(source).toContain('tabindex="0"')
    expect(source).toContain('handlePermissionTabKeydown')
    expect(source).toContain("event.key === 'Home'")
    expect(source).toContain("event.key === 'End'")
  })

  it('オペレーター権限の解除前に確認ダイアログを表示する', () => {
    expect(source).toContain('openOperatorAccessConfirmation(account)')
    expect(source).toContain('オペレーター権限を解除しますか？')
    expect(source).toContain('confirmOperatorAccessRemoval')
  })
})
