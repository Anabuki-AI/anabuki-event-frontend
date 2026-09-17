import { onMounted, onUnmounted } from 'vue'

// Administrator access requests use this shared contract and polling helper.
export type AccessRequestStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'CANCELLED'

export type AccessRequestDecision = 'approve' | 'reject'

export type AccessRequestId = number | string

// The primary admin database uses numeric request IDs, while the operator
// schema uses UUID strings. Callers must choose one rather than accepting a
// mixed ID type at an API boundary.
export interface AccessRequest<Id extends AccessRequestId> {
  id: Id
  email: string
  status: AccessRequestStatus
  createdAt: string
  expiresAt: string
  cancelledAt: string | null
  cancellationReason: string | null
  decidedAt: string | null
}

export type AdminAccessRequest = AccessRequest<number>
export type OperatorAccessRequest = AccessRequest<string>

export const ACCESS_REQUEST_POLL_INTERVAL_MS = 10_000

// A PENDING request that moved to a terminal state while the user was watching
// (typically via background polling) deserves a one-time announcement.
export function detectAccessRequestDecision(
  previous: AccessRequestStatus | undefined,
  next: AccessRequestStatus | undefined,
): AccessRequestStatus | undefined {
  if (previous !== 'PENDING' || !next || next === 'PENDING') return undefined
  return next
}

// Shared 10-second status polling for the application screens. Refreshes only
// while the tab is visible and `isActive` says the current state still needs
// polling; timers and listeners are cleaned up on unmount.
export function useAccessRequestPolling(options: {
  isActive: () => boolean
  refresh: () => Promise<void>
}) {
  let timer: ReturnType<typeof setInterval> | undefined
  function checkForUpdates() {
    if (document.visibilityState === 'hidden' || !options.isActive()) return
    void options.refresh()
  }
  onMounted(() => {
    timer = setInterval(checkForUpdates, ACCESS_REQUEST_POLL_INTERVAL_MS)
    document.addEventListener('visibilitychange', checkForUpdates)
  })
  onUnmounted(() => {
    clearInterval(timer)
    document.removeEventListener('visibilitychange', checkForUpdates)
  })
}
