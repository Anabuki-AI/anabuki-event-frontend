import type { AccessRequest as SharedAccessRequest } from '~/lib/auth/access-request'

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
export type AccessRequest = SharedAccessRequest<number>
export type { AccessRequestDecision, AccessRequestStatus } from '~/lib/auth/access-request'
