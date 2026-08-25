export type AccessSource = 'APPLICANT' | 'MANAGEMENT_ACCESS' | 'ENVIRONMENT_ACCESS'
export type Permission = 'MANAGEMENT_PAGE_VIEW' | 'ACCESS_REQUEST_APPROVE' | 'MANAGEMENT_ACCESS_REVOKE'
export type AccessRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED'

export type ManagementAccessEntry = {
  id: string | null
  email: string
  source: Extract<AccessSource, 'MANAGEMENT_ACCESS' | 'ENVIRONMENT_ACCESS'>
  active: boolean
}

export type AdminSession = {
  email: string
  googleSub: string
  accessSource: AccessSource
  permissions: Permission[]
  expiresAt: string
}

export type AccessRequest = {
  id: number
  email: string
  status: AccessRequestStatus
  createdAt: string
  decidedAt: string | null
}
