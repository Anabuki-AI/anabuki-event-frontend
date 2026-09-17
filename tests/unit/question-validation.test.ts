import { describe, expect, it } from 'vitest'
import { parseTimeLimitInput, problemErrorMessage, validateMultiplierInput, validatePointsInput, validateTimeLimitInput } from '../../app/features/problems/validation'
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

describe('validateTimeLimitInput', () => {
  it('空欄は制限時間なしとして許可する', () => {
    expect(validateTimeLimitInput('')).toBe('')
    expect(validateTimeLimitInput('   ')).toBe('')
  })

  it('数値以外・小数はエラー', () => {
    expect(validateTimeLimitInput('abc')).toContain('整数')
    expect(validateTimeLimitInput('1.5')).toContain('整数')
  })

  it('0以下はエラー', () => {
    expect(validateTimeLimitInput('0')).toContain('1秒以上')
    expect(validateTimeLimitInput('-5')).toContain('1秒以上')
  })

  it('正の整数はOK', () => {
    expect(validateTimeLimitInput('1')).toBe('')
    expect(validateTimeLimitInput('30')).toBe('')
    expect(validateTimeLimitInput('2147483647')).toBe('')
  })

  it('APIが受け付ける上限を超える値はエラー', () => {
    expect(validateTimeLimitInput('2147483648')).toContain('2147483647秒以下')
  })
})

describe('parseTimeLimitInput', () => {
  it('空欄は null(制限時間なし)に変換する', () => {
    expect(parseTimeLimitInput('')).toBeNull()
    expect(parseTimeLimitInput('   ')).toBeNull()
  })

  it('数値文字列は整数の秒数に変換する', () => {
    expect(parseTimeLimitInput('30')).toBe(30)
    expect(parseTimeLimitInput('45')).toBe(45)
  })
})

describe('validatePointsInput', () => {
  it('空入力はエラー', () => {
    expect(validatePointsInput('', 1, 1000)).toBe('配点を入力してください')
  })

  it('整数以外はエラー', () => {
    expect(validatePointsInput('abc', 1, 1000)).toBe('整数で入力してください')
    expect(validatePointsInput('1.5', 1, 1000)).toBe('整数で入力してください')
    expect(validatePointsInput('-1', 1, 1000)).toBe('整数で入力してください')
  })

  it('範囲外はエラー', () => {
    expect(validatePointsInput('0', 1, 1000)).toContain('範囲')
    expect(validatePointsInput('1001', 1, 1000)).toContain('範囲')
  })

  it('境界値は OK', () => {
    expect(validatePointsInput('1', 1, 1000)).toBe('')
    expect(validatePointsInput('1000', 1, 1000)).toBe('')
    expect(validatePointsInput(100, 1, 1000)).toBe('')
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
