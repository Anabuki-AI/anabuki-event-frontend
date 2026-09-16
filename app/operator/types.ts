export type OperatorAccessSource = 'APPLICANT' | 'MANAGER'

export interface OperatorSession {
  email: string
  googleSub: string
  accessSource: OperatorAccessSource
  expiresAt: string
}
