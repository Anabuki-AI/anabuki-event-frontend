const STORAGE_KEY = 'anabuki-event.userId'

export function getMyUserId(): number | null {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) {
    return null
  }

  const parsed = Number.parseInt(raw, 10)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null
}

export function setMyUserId(userId: number): void {
  localStorage.setItem(STORAGE_KEY, String(userId))
}

export function clearMyUserId(): void {
  localStorage.removeItem(STORAGE_KEY)
}
