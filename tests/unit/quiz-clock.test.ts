import { describe, expect, it } from 'vitest'
import { computeCountdown, createExpireGuard, formatClock, formatElapsed } from '../../app/features/quiz-control/useQuizClock'

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

describe('computeCountdown', () => {
  it('time_limit_seconds が null/undefined なら制限時間なし扱いにする', () => {
    const now = new Date('2026-09-07T12:00:30Z')
    expect(computeCountdown('2026-09-07T12:00:00Z', null, now)).toEqual({
      hasLimit: false,
      remainingSeconds: null,
      remainingLabel: '--:--',
      remainingRatio: null,
      urgency: 'none',
    })
    expect(computeCountdown('2026-09-07T12:00:00Z', undefined, now)).toMatchObject({ hasLimit: false })
  })

  it('phase_started_at が null/undefined なら制限時間なし扱いにする(バックエンド未対応時の防御)', () => {
    expect(computeCountdown(null, 30, new Date())).toMatchObject({ hasLimit: false, urgency: 'none' })
    expect(computeCountdown(undefined, 30, new Date())).toMatchObject({ hasLimit: false, urgency: 'none' })
  })

  it('残り時間が十分あるときは normal', () => {
    const now = new Date('2026-09-07T12:00:05Z')
    const countdown = computeCountdown('2026-09-07T12:00:00Z', 30, now)
    expect(countdown).toMatchObject({ hasLimit: true, remainingSeconds: 25, remainingLabel: '00:25', urgency: 'normal' })
  })

  it('残り割合が25%以下になったら warning', () => {
    const now = new Date('2026-09-07T12:00:23Z')
    const countdown = computeCountdown('2026-09-07T12:00:00Z', 30, now)
    expect(countdown).toMatchObject({ remainingSeconds: 7, urgency: 'warning' })
  })

  it('残り時間が0になったら expired で、超過分は0未満にならない', () => {
    const now = new Date('2026-09-07T12:01:00Z')
    const countdown = computeCountdown('2026-09-07T12:00:00Z', 30, now)
    expect(countdown).toMatchObject({ remainingSeconds: 0, remainingLabel: '00:00', urgency: 'expired' })
  })
})

describe('createExpireGuard', () => {
  it('残り時間が0になった瞬間に一度だけtrueを返す(同じkeyでの多重発火を防ぐ)', () => {
    const guard = createExpireGuard()
    expect(guard.shouldFire('q1', 5)).toBe(false)
    expect(guard.shouldFire('q1', 1)).toBe(false)
    expect(guard.shouldFire('q1', 0)).toBe(true)
    // 0のまま複数回チェックされても再発火しない(ポーリングやタイマーのtickで重複呼び出しされる想定)
    expect(guard.shouldFire('q1', 0)).toBe(false)
    expect(guard.shouldFire('q1', 0)).toBe(false)
  })

  it('keyが変わる(次の問題・次のフェーズに進む)と再び1回だけ発火できる', () => {
    const guard = createExpireGuard()
    expect(guard.shouldFire('q1', 0)).toBe(true)
    expect(guard.shouldFire('q1', 0)).toBe(false)
    expect(guard.shouldFire('q2', 0)).toBe(true)
    expect(guard.shouldFire('q2', 0)).toBe(false)
  })

  it('reset()で明示的にガードを解除できる', () => {
    const guard = createExpireGuard()
    expect(guard.shouldFire('q1', 0)).toBe(true)
    guard.reset()
    expect(guard.shouldFire('q1', 0)).toBe(true)
  })
})
