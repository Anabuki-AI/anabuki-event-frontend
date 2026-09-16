import { beforeEach, describe, expect, it } from 'vitest'
import { clearMyUserId, getMyUserId, setMyUserId } from '../../app/features/rankings/storage'

describe('my user id storage', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('returns null when no id is stored', () => {
    expect(getMyUserId()).toBeNull()
  })

  it('stores and reads back an id', () => {
    setMyUserId(42)

    expect(getMyUserId()).toBe(42)
  })

  it('returns null for a non-numeric stored value', () => {
    localStorage.setItem('anabuki-event.userId', 'not-a-number')

    expect(getMyUserId()).toBeNull()
  })

  it('returns null for a non-positive stored value', () => {
    localStorage.setItem('anabuki-event.userId', '0')

    expect(getMyUserId()).toBeNull()
  })

  it('removes the stored id', () => {
    setMyUserId(42)
    clearMyUserId()

    expect(getMyUserId()).toBeNull()
  })
})
