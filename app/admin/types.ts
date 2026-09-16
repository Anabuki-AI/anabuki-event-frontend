export type AdminAccessSource =
  | 'APPLICANT'
  | 'MANAGEMENT_ACCESS'
  | 'ENVIRONMENT_ACCESS'

export interface AdminSession {
  email: string
  googleSub: string
  accessSource: AdminAccessSource
  permissions: string[]
  expiresAt: string
}

// Access-request shapes follow the same contract in the admin and operator
// portals, so they live in the shared auth module.
export type { AccessRequest, AccessRequestDecision, AccessRequestStatus } from '~/lib/auth/access-request'
