import { describe, expect, it } from 'vitest'
import { problemErrorMessage, validateMultiplierInput } from '../../app/features/problems/validation'
import { formatMultiplier } from '../../app/features/problems/constants'

describe('problemErrorMessage', () => {
  it('案内を管理者だけでなくオペレーターにも対応させる', () => {
    expect(problemErrorMessage(401, 'fallback')).toBe('ログインの有効期限が切れました。オペレーターまたは管理者として再度ログインしてください。')
    expect(problemErrorMessage(403, 'fallback')).toBe('問題管理を行う権限がありません。オペレーター権限または管理者権限について、運営担当者へお問い合わせください。')
  })
})

describe('validateMultiplierInput', () => {
  it('空入力はエラー', () => {
    expect(validateMultiplierInput('', 0, 9.99)).toBe('自信度倍率を入力してください')
  })

  it('数値以外はエラー', () => {
    expect(validateMultiplierInput('abc', 0, 9.99)).toBe('数値で入力してください')
  })

  it('範囲外はエラー', () => {
    expect(validateMultiplierInput('-0.1', 0, 9.99)).toContain('範囲')
    expect(validateMultiplierInput('10', 0, 9.99)).toContain('範囲')
  })

  it('小数3桁はエラー', () => {
    expect(validateMultiplierInput('1.234', 0, 9.99)).toContain('2桁')
  })

  it('境界値と小数2桁は OK', () => {
    expect(validateMultiplierInput('0', 0, 9.99)).toBe('')
    expect(validateMultiplierInput('9.99', 0, 9.99)).toBe('')
    expect(validateMultiplierInput('1.5', 0, 9.99)).toBe('')
  })
})

describe('formatMultiplier', () => {
  it('小数2桁に整形する', () => {
    expect(formatMultiplier('1')).toBe('1.00')
    expect(formatMultiplier('1.5')).toBe('1.50')
    expect(formatMultiplier(2)).toBe('2.00')
  })

  it('不正値はそのまま返す', () => {
    expect(formatMultiplier('abc')).toBe('abc')
  })
})
