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

export type AccessRequestStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'CANCELLED'

export type AccessRequestDecision = 'approve' | 'reject'

export interface AccessRequest {
  id: number
  email: string
  status: AccessRequestStatus
  createdAt: string
  expiresAt: string
  cancelledAt: string | null
  cancellationReason: string | null
  decidedAt: string | null
}
