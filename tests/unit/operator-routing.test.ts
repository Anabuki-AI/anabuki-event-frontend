import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it, vi } from 'vitest'
import { ApiError } from '~/lib/api/error'
import { eventOperatorRedirect } from '~/operator/route-guard'
import type { AdminSession } from '~/admin/types'
import type { OperatorSession } from '~/operator/types'

const manager: OperatorSession = {
  email: 'manager@example.com', googleSub: 'manager-subject', accessSource: 'MANAGER', expiresAt: '2026-09-28T09:00:00Z',
}
const applicant: OperatorSession = { ...manager, accessSource: 'APPLICANT' }
const admin: AdminSession = {
  email: 'admin@example.com', googleSub: 'admin-subject', accessSource: 'MANAGEMENT_ACCESS',
  permissions: ['MANAGEMENT_PAGE_VIEW'], expiresAt: '2026-09-28T09:00:00Z',
}

describe('event operator route guard', () => {
  it('allows an operator manager session into event operator routes', async () => {
    const loadOperator = vi.fn().mockResolvedValue(manager)
    const loadAdmin = vi.fn()

    await expect(eventOperatorRedirect('/event_operator/quiz-control', loadOperator, loadAdmin)).resolves.toBeNull()
    expect(loadOperator).toHaveBeenCalledOnce()
    expect(loadAdmin).not.toHaveBeenCalled()
  })

  it('allows an admin session without an operator session', async () => {
    const loadOperator = vi.fn().mockRejectedValue(new ApiError('Authentication is required', 401))
    const loadAdmin = vi.fn().mockResolvedValue(admin)

    await expect(eventOperatorRedirect('/event_operator/management', loadOperator, loadAdmin)).resolves.toBeNull()
    expect(loadAdmin).toHaveBeenCalledOnce()
  })

  it('returns an operator applicant without admin access to the operator portal', async () => {
    const loadAdmin = vi.fn().mockRejectedValue(new ApiError('Authentication is required', 401))
    await expect(eventOperatorRedirect('/event_operator/voting-rate', async () => applicant, loadAdmin)).resolves.toBe('/operator/login')
  })

  it('does not query either authentication source for unrelated routes', async () => {
    const loadOperator = vi.fn().mockResolvedValue(manager)
    const loadAdmin = vi.fn().mockResolvedValue(admin)
    await expect(eventOperatorRedirect('/admin', loadOperator, loadAdmin)).resolves.toBeNull()
    expect(loadOperator).not.toHaveBeenCalled()
    expect(loadAdmin).not.toHaveBeenCalled()
  })
})

describe('operator navigation wiring', () => {
  const pagesDirectory = join(process.cwd(), 'app/pages/event_operator')

  it('contains no links or redirects into the admin route namespace', () => {
    const source = readdirSync(pagesDirectory).filter(file => file.endsWith('.vue')).map(file => readFileSync(join(pagesDirectory, file), 'utf8')).join('\n')
    expect(source).not.toMatch(/(?:to=|path:\s*)["']\/admin/)
  })

  it('does not retain the management page admin-only middleware', () => {
    const source = readFileSync(join(pagesDirectory, 'management.vue'), 'utf8')
    expect(source).not.toContain("middleware: 'admin-client'")
  })

  it('offers a manager an explicit link from the portal to event operations', () => {
    const source = readFileSync(join(process.cwd(), 'app/operator/components/OperatorPortal.vue'), 'utf8')
    expect(source).toContain('to="/event_operator"')
  })
})
