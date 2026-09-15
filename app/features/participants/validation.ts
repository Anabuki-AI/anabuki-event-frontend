import type { ParticipantRegistration } from './types'

export type ParticipantRegistrationField = keyof ParticipantRegistration
export type ParticipantRegistrationErrors = Partial<Record<ParticipantRegistrationField, string>>

export function validateParticipantRegistration(input: ParticipantRegistration): ParticipantRegistrationErrors {
  const errors: ParticipantRegistrationErrors = {}

  if (!input.displayName.trim()) {
    errors.displayName = '表示名を入力してください。'
  }
  else if (input.displayName.length > 100) {
    errors.displayName = '表示名は100文字以内で入力してください。'
  }

  for (const field of ['gender', 'ageGroup', 'studentType'] as const) {
    if (!input[field]) {
      errors[field] = '選択してください。'
    }
  }

  for (const field of ['school', 'department'] as const) {
    if (input[field].length > 255) {
      errors[field] = '255文字以内で入力してください。'
    }
  }

  if (!input.agreedTerms) {
    errors.agreedTerms = '参加規約への同意が必要です。'
  }

  return errors
}
