export type OperatorAccessSource = 'APPLICANT' | 'MANAGER'

// Kept separate from the numeric admin-request contract for any operator
// request endpoint consumers.
export type { OperatorAccessRequest } from '~/lib/auth/access-request'

export interface OperatorSession {
  email: string
  googleSub: string
  accessSource: OperatorAccessSource
  expiresAt: string
}
