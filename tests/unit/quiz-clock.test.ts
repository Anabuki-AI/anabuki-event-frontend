import { describe, expect, it } from 'vitest'
import { formatClock, formatElapsed } from '../../app/features/quiz-control/useQuizClock'

describe('formatElapsed', () => {
  const now = new Date('2026-09-05T12:34:56+09:00')

  it('null は --:-- を返す', () => {
    expect(formatElapsed(null, now)).toBe('--:--')
  })

  it('経過時間を MM:SS で返す', () => {
    const from = new Date('2026-09-05T12:32:26+09:00') // 150秒前
    expect(formatElapsed(from, now)).toBe('02:30')
  })

  it('未来の時刻は 00:00 にクランプする', () => {
    const from = new Date('2026-09-05T12:35:56+09:00') // 60秒後
    expect(formatElapsed(from, now)).toBe('00:00')
  })

  it('1時間以上も MM:SS で返す', () => {
    const from = new Date('2026-09-05T11:30:56+09:00') // 64分前
    expect(formatElapsed(from, now)).toBe('64:00')
  })
})

describe('formatClock', () => {
  it('HH:MM:SS 形式で返す', () => {
    const date = new Date('2026-09-05T09:05:03+09:00')
    expect(formatClock(date)).toBe('09:05:03')
  })
})
