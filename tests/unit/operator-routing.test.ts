import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it, vi } from 'vitest'
import { ApiError } from '~/lib/api/error'
import { eventOperatorRedirect } from '~/operator/route-guard'
import type { OperatorSession } from '~/operator/types'

const manager: OperatorSession = {
  email: 'manager@example.com',
  googleSub: 'manager-subject',
  accessSource: 'MANAGER',
  expiresAt: '2026-09-28T09:00:00Z',
}

const applicant: OperatorSession = {
  ...manager,
  accessSource: 'APPLICANT',
}

describe('event operator route guard', () => {
  it('allows a manager session into event operator routes', async () => {
    const loadSession = vi.fn().mockResolvedValue(manager)

    await expect(eventOperatorRedirect('/event_operator/quiz-control', loadSession)).resolves.toBeNull()
    expect(loadSession).toHaveBeenCalledOnce()
  })

  it('redirects an unauthenticated visitor to operator login', async () => {
    const loadSession = vi.fn().mockRejectedValue(new ApiError('Authentication is required', 401))

    await expect(eventOperatorRedirect('/event_operator', loadSession)).resolves.toBe('/operator/login')
  })

  it('returns an applicant to the operator approval portal', async () => {
    const loadSession = vi.fn().mockResolvedValue(applicant)

    await expect(eventOperatorRedirect('/event_operator/voting-rate', loadSession)).resolves.toBe('/operator')
  })

  it('does not query operator auth for unrelated routes', async () => {
    const loadSession = vi.fn().mockResolvedValue(manager)

    await expect(eventOperatorRedirect('/admin', loadSession)).resolves.toBeNull()
    expect(loadSession).not.toHaveBeenCalled()
  })
})

describe('operator navigation wiring', () => {
  const pagesDirectory = join(process.cwd(), 'app/pages/event_operator')

  it('contains no links or redirects into the admin route namespace', () => {
    const source = readdirSync(pagesDirectory)
      .filter(file => file.endsWith('.vue'))
      .map(file => readFileSync(join(pagesDirectory, file), 'utf8'))
      .join('\n')

    expect(source).not.toMatch(/(?:to=|path:\s*)["']\/admin/)
  })

  it('connects the home operator entry to the login portal', () => {
    const source = readFileSync(join(process.cwd(), 'app/pages/index.vue'), 'utf8')

    expect(source).toContain('to="/operator"')
    expect(source).not.toContain('to="/event_operator"')
  })

  it('offers a manager an explicit link from the portal to event operations', () => {
    const source = readFileSync(join(process.cwd(), 'app/operator/components/OperatorPortal.vue'), 'utf8')

    expect(source).toContain('to="/event_operator"')
    expect(source).toContain('イベント運営画面へ')
  })
})
