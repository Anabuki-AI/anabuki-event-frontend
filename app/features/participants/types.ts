export interface ParticipantRegistration {
  displayName: string
  gender: string
  ageGroup: string
  studentType: string
  school: string
  department: string
  agreedTerms: boolean
}

export interface Participant extends ParticipantRegistration {
  id: string
  sessionExpiresAt: string
}

export interface ParticipantPresence {
  activeParticipantCount: number
  observedAt: string
  activeWindowSeconds: number
}
