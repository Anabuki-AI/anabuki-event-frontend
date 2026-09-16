import type { AccessRequest as SharedAccessRequest } from '~/lib/auth/access-request'

export type OperatorAccessSource = 'APPLICANT' | 'MANAGER'

export interface OperatorSession {
  email: string
  googleSub: string
  accessSource: OperatorAccessSource
  expiresAt: string
}

// Operator access requests are UUID-keyed in the dedicated operator database.
export type AccessRequest = SharedAccessRequest<string>
export type { AccessRequestDecision, AccessRequestStatus } from '~/lib/auth/access-request'
