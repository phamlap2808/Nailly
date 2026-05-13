export default defineNuxtRouteMiddleware(async () => {
  const session = useSessionStore()

  if (!session.loaded) {
    await session.loadMe()
  }

  if (!session.user) {
    return navigateTo('/admin/login')
  }
})
