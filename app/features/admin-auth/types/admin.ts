export type AdminRole = 'APPLICANT' | 'DB_ADMIN' | 'ENV_ADMIN'
export type AccessRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED'

export type AdminEmailEntry = {
  id: number | null
  email: string
  source: 'ENVIRONMENT' | 'DATABASE'
  active: boolean
}

export type AdminSession = {
  email: string
  googleSub: string
  role: AdminRole
  expiresAt: string
}

export type AccessRequest = {
  id: number
  email: string
  status: AccessRequestStatus
  createdAt: string
  decidedAt: string | null
}
