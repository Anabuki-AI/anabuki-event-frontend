export type AdminEmailEntry = {
  id: number | null
  email: string
  source: 'ENVIRONMENT' | 'DATABASE'
  active: boolean
}

export type AdminSession = {
  email: string
  googleSub: string
  expiresAt: string
}
