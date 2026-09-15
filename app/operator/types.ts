export type OperatorAccessSource = 'APPLICANT' | 'MANAGER'

export interface OperatorSession {
  email: string
  googleSub: string
  accessSource: OperatorAccessSource
  expiresAt: string
}

// Operator access requests share the admin portal's contract.
export type { AccessRequest, AccessRequestDecision, AccessRequestStatus } from '~/lib/auth/access-request'
