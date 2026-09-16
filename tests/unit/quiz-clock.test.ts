import { describe, expect, it } from 'vitest'
import { formatClock, formatElapsed } from '../../app/features/quiz-control/useQuizClock'

describe('formatElapsed', () => {
  it('null は --:-- を返す', () => {
    expect(formatElapsed(null, new Date('2026-09-07T12:00:00Z'))).toBe('--:--')
  })

  it('ISO文字列からの経過を MM:SS で返す', () => {
    const now = new Date('2026-09-07T12:02:30Z')
    expect(formatElapsed('2026-09-07T12:00:00Z', now)).toBe('02:30')
  })

  it('1時間以上は分数で継続する（65分 → 65:00）', () => {
    const now = new Date('2026-09-07T13:05:00Z')
    expect(formatElapsed('2026-09-07T12:00:00Z', now)).toBe('65:00')
  })

  it('未来時刻は 00:00 に丸める', () => {
    const now = new Date('2026-09-07T11:59:00Z')
    expect(formatElapsed('2026-09-07T12:00:00Z', now)).toBe('00:00')
  })
})

describe('formatClock', () => {
  it('HH:MM:SS 形式で返す（2桁パディング）', () => {
    expect(formatClock(new Date(2026, 8, 7, 9, 5, 3))).toBe('09:05:03')
  })
})
