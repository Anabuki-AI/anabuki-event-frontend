import { NG_WORDS, USERNAME_MAX, USERNAME_MIN } from './definitions'

export function validateUserName(value: string): string {
  if (value.trim() === '') {
    return 'ユーザーネームを入力してください'
  }

  const length = Array.from(value).length
  if (length < USERNAME_MIN || length > USERNAME_MAX) {
    return `ユーザーネームは${USERNAME_MIN}文字以上${USERNAME_MAX}文字以下で入力してください`
  }

  const lowered = value.toLowerCase()
  if (NG_WORDS.some(ngWord => lowered.includes(ngWord.toLowerCase()))) {
    return '使用できない言葉が含まれています'
  }

  return ''
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

/** その他の学校(入力)で選択された場合の学校名チェック。プレースホルダ値以外の値が入っていれば有効 */
export function validateOtherSchoolName(school: string, isRequired: boolean): string {
  return isRequired && (school === '' || school === 'other_school') ? '学校名を入力してください' : ''
}
