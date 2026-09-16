import { adminAuthApi } from '~/admin/api/admin-auth'
import { ApiError } from '~/lib/api/error'

/**
 * The admin portal owns login and authorization UX. Protected admin pages only
 * redirect there when the browser cookie session is absent or lacks the view permission.
 */
export default defineNuxtRouteMiddleware(async () => {
  try {
    const session = await adminAuthApi.session()
    if (!session.permissions.includes('MANAGEMENT_PAGE_VIEW')) {
      return navigateTo('/admin')
    }
  }
  catch (error) {
    if (error instanceof ApiError && (error.statusCode === 401 || error.statusCode === 403)) {
      return navigateTo('/admin')
    }
    // Leave network failures to the page-level retry UI instead of making login appear to fail.
  }
})
