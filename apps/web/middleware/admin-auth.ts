import { canAccessAdminPath, firstAccessibleAdminPath } from '../utils/admin-permissions'

export default defineNuxtRouteMiddleware(async (to) => {
  const session = useSessionStore()

  if (!session.loaded) {
    await session.loadMe()
  }

  if (!session.user) {
    return navigateTo('/admin/login')
  }

  if (!canAccessAdminPath(to.path, session.user.permissions)) {
    if (to.path === '/admin') {
      return navigateTo(firstAccessibleAdminPath(session.user.permissions))
    }

    return navigateTo('/admin/forbidden')
  }
})
