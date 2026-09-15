export type GoogleAuthScope = 'admin' | 'operator'

// Admin shares the generic /auth/google paths; operator paths are namespaced
// under /auth/operator to keep the two portals' cookies and callbacks apart.
const scopePathSegment: Record<GoogleAuthScope, string> = {
  admin: '',
  operator: '/operator',
}

// OAuth starts with a full-page navigation to the backend, which then redirects
// to Google. The URL lives under the same-origin API base.
export function buildGoogleStartUrl(apiBase: string, scope: GoogleAuthScope) {
  return `${apiBase.replace(/\/$/, '')}/auth${scopePathSegment[scope]}/google/start`
}

// The backend bounces failed OAuth navigations back to each portal with
// ?auth_error=google so the page can explain what happened.
export function isGoogleAuthError(query: unknown) {
  return (query as { auth_error?: unknown } | null)?.auth_error === 'google'
}
