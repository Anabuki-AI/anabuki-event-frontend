import { describe, expect, it } from 'vitest'
import { validateParticipantRegistration } from '../../app/features/participants/validation'

const validRegistration = {
  displayName: 'Quiz Player',
  gender: 'no_answer',
  ageGroup: '20s',
  studentType: 'not_student',
  school: '',
  department: '',
  agreedTerms: true,
}

describe('validateParticipantRegistration', () => {
  it('accepts a complete participant registration', () => {
    expect(validateParticipantRegistration(validRegistration)).toEqual({})
  })

  it('requires the fields required by the participant API', () => {
    expect(validateParticipantRegistration({
      ...validRegistration,
      displayName: '',
      gender: '',
      ageGroup: '',
      studentType: '',
      agreedTerms: false,
    })).toEqual({
      displayName: '表示名を入力してください。',
      gender: '選択してください。',
      ageGroup: '選択してください。',
      studentType: '選択してください。',
      agreedTerms: '参加規約への同意が必要です。',
    })
  })
})
