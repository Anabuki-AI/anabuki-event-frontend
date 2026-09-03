import { describe, expect, it } from 'vitest'
import {
  validateDepartmentSelection,
  validateRequiredOption,
  validateTermsAgreement,
  validateUserName,
} from '../../app/features/registration/validation'

describe('validateUserName', () => {
  it('空文字は必須メッセージを返す', () => {
    expect(validateUserName('')).toBe('ユーザーネームを入力してください')
  })

  it('空白のみも必須メッセージを返す', () => {
    expect(validateUserName('   ')).toBe('ユーザーネームを入力してください')
  })

  it('下限未満は文字数メッセージを返す', () => {
    expect(validateUserName('ab')).toBe('ユーザーネームは3文字以上20文字以下で入力してください')
  })

  it('下限ちょうどは正常', () => {
    expect(validateUserName('abc')).toBe('')
  })

  it('上限ちょうどは正常', () => {
    expect(validateUserName('a'.repeat(20))).toBe('')
  })

  it('上限超過は文字数メッセージを返す', () => {
    expect(validateUserName('a'.repeat(21))).toBe('ユーザーネームは3文字以上20文字以下で入力してください')
  })

  it('全角文字は1文字として数える(サロゲートペア考慮)', () => {
    expect(validateUserName('あいう')).toBe('')
    expect(validateUserName('あいうえお')).toBe('')
  })

  it('NG語(大文字混じり)を含むと不適切メッセージを返す', () => {
    expect(validateUserName('Admin太郎')).toBe('使用できない言葉が含まれています')
  })

  it('クリーンな名前は正常', () => {
    expect(validateUserName('yuzumican')).toBe('')
  })
})

describe('validateTermsAgreement', () => {
  it('未同意はエラーメッセージを返す', () => {
    expect(validateTermsAgreement(false)).toBe('利用規約に同意してください')
  })

  it('同意済みは正常', () => {
    expect(validateTermsAgreement(true)).toBe('')
  })
})

describe('validateRequiredOption', () => {
  it('未選択はラベル付きエラーメッセージを返す', () => {
    expect(validateRequiredOption('', '性別')).toBe('性別を選択してください')
  })

  it('選択済みは正常', () => {
    expect(validateRequiredOption('male', '性別')).toBe('')
  })
})

describe('validateDepartmentSelection', () => {
  it('必須かつ未選択はエラーメッセージを返す', () => {
    expect(validateDepartmentSelection('', true)).toBe('学科を選択してください')
  })

  it('必須でも選択済みなら正常', () => {
    expect(validateDepartmentSelection('ai_technology', true)).toBe('')
  })

  it('任意なら未選択でも正常', () => {
    expect(validateDepartmentSelection('', false)).toBe('')
  })
})
