import type { AdminAccessRequest } from '~/lib/auth/access-request'

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

// Admin access requests use the primary database's numeric IDs.
export type AccessRequest = AdminAccessRequest
export type { AccessRequestDecision, AccessRequestStatus, OperatorAccessRequest } from '~/lib/auth/access-request'
