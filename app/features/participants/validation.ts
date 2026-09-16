export function validateDisplayName(value: string): string {
  if (!value.trim()) {
    return '表示名を入力してください'
  }

  return Array.from(value).length > 100 ? '表示名は100文字以内で入力してください' : ''
}

export function validateTermsAgreement(agreed: boolean): string {
  return agreed ? '' : '利用規約に同意してください'
}

export function validateRequiredOption(value: string, label: string): string {
  return value === '' ? `${label}を選択してください` : ''
}

export function validateDepartmentSelection(value: string, isRequired: boolean): string {
  return isRequired && value === '' ? '学科を選択してください' : ''
}

export function validateSchoolName(value: string, isRequired: boolean): string {
  if (!isRequired) {
    return ''
  }

  if (!value.trim() || value === 'other_school') {
    return '学校名を入力してください'
  }

  return Array.from(value).length > 255 ? '学校名は255文字以内で入力してください' : ''
}
