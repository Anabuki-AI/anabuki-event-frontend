import { describe, expect, it } from 'vitest'
import {
  validateDepartmentSelection,
  validateDisplayName,
  validateRequiredOption,
  validateSchoolName,
  validateTermsAgreement,
} from '../../app/features/participants/validation'

describe('validateDisplayName', () => {
  it('requires a non-blank display name', () => {
    expect(validateDisplayName('')).toBe('表示名を入力してください')
    expect(validateDisplayName('   ')).toBe('表示名を入力してください')
  })

  it('allows duplicate-capable display names up to the API limit', () => {
    expect(validateDisplayName('Quiz Player')).toBe('')
    expect(validateDisplayName('a'.repeat(100))).toBe('')
    expect(validateDisplayName('a'.repeat(101))).toBe('表示名は100文字以内で入力してください')
  })
})

describe('participant registration fields', () => {
  it('requires agreement to the terms', () => {
    expect(validateTermsAgreement(false)).toBe('利用規約に同意してください')
    expect(validateTermsAgreement(true)).toBe('')
  })

  it('requires selected survey options', () => {
    expect(validateRequiredOption('', '性別')).toBe('性別を選択してください')
    expect(validateRequiredOption('male', '性別')).toBe('')
  })

  it('requires school and department only for the applicable student type', () => {
    expect(validateSchoolName('', false)).toBe('')
    expect(validateSchoolName('', true)).toBe('学校名を入力してください')
    expect(validateSchoolName('other_school', true)).toBe('学校名を入力してください')
    expect(validateSchoolName('穴吹ITビジネスカレッジ', true)).toBe('')
    expect(validateDepartmentSelection('', true)).toBe('学科を選択してください')
    expect(validateDepartmentSelection('', false)).toBe('')
  })
})
