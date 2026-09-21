import { describe, expect, it } from 'vitest'
import { FLOAT_CONFIG, appendWithLimit, createFloatingReaction } from '~/features/projector/floating-reactions'

describe('createFloatingReaction', () => {
  it('keeps every random parameter inside the configured ranges', () => {
    for (const r of [0, 0.25, 0.5, 0.999]) {
      const item = createFloatingReaction({ reaction: '👏' }, () => r, true)
      expect(item.emoji).toBe('👏')
      expect(item.left).toBeGreaterThanOrEqual(FLOAT_CONFIG.leftPct[0])
      expect(item.left).toBeLessThanOrEqual(FLOAT_CONFIG.leftPct[1])
      expect(item.duration).toBeGreaterThanOrEqual(FLOAT_CONFIG.durationMs[0])
      expect(item.duration).toBeLessThanOrEqual(FLOAT_CONFIG.durationMs[1])
      expect(item.size).toBeGreaterThanOrEqual(FLOAT_CONFIG.sizePx[0])
      expect(item.size).toBeLessThanOrEqual(FLOAT_CONFIG.sizePx[1])
      expect(Math.abs(item.drift)).toBeLessThanOrEqual(FLOAT_CONFIG.driftPx)
      expect(item.delay).toBeLessThanOrEqual(FLOAT_CONFIG.spreadMs)
    }
  })
  it('gives unique keys and no delay unless spread is requested', () => {
    const a = createFloatingReaction({ reaction: '🎉' }, () => 0.9)
    const b = createFloatingReaction({ reaction: '🎉' }, () => 0.9)
    expect(a.key).not.toBe(b.key)
    expect(a.delay).toBe(0)
  })
})

describe('appendWithLimit', () => {
  it('drops the oldest items beyond the concurrent limit', () => {
    const make = () => createFloatingReaction({ reaction: '👍' }, () => 0.5)
    const current = [make(), make(), make()]
    const added = [make(), make()]
    const result = appendWithLimit(current, added, 4)
    expect(result).toHaveLength(4)
    expect(result.slice(-2)).toEqual(added)
    expect(result[0]).toBe(current[1])
  })
  it('does not touch lists under the limit', () => {
    expect(appendWithLimit([], [], 3)).toEqual([])
  })
})
