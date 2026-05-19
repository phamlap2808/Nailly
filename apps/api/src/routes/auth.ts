import { Hono } from 'hono'
import { getCookie } from 'hono/cookie'
import { adminRoleSchema } from '@nailly/shared'
import { loadEnv } from '../config/env'
import { signAdminToken, verifyAdminToken, setAdminCookie, clearAdminCookie } from '../http/auth'
import { resolveRolePermissions } from '../http/rbac'
import { ApiError, errorResponse } from '../http/errors'
import { createAdminRepository } from '../repositories/admin.repository'
import { createAdminUserRepository } from '../repositories/admin-user.repository'
import { AuthService } from '../services/auth.service'

export function authRoutes(
  authService = new AuthService(createAdminUserRepository()),
  adminRepository = createAdminRepository()
) {
  const router = new Hono()

  async function withPermissions<T extends { role: string }>(profile: T) {
    const role = adminRoleSchema.parse(profile.role)
    const permissionRows = await adminRepository.getRolePermissionRows(role)

    return {
      ...profile,
      permissions: resolveRolePermissions(role, permissionRows)
    }
  }

  router.post('/login', async (c) => {
    const { email, password } = await c.req.json<{ email: string; password: string }>()
    const profile = await authService.login(email, password)
    const responseProfile = await withPermissions(profile)
    const env = loadEnv()
    const token = await signAdminToken(profile, env.AUTH_JWT_SECRET)
    setAdminCookie(c, token)

    return c.json(responseProfile)
  })

  router.post('/logout', (c) => {
    clearAdminCookie(c)
    return c.json({ ok: true })
  })

  router.get('/me', async (c) => {
    const env = loadEnv()
    const token = getCookie(c, env.AUTH_COOKIE_NAME)

    if (!token) {
      return errorResponse(c, new ApiError(401, 'unauthenticated', 'Not authenticated.'))
    }

    try {
      const profile = await verifyAdminToken(token, env.AUTH_JWT_SECRET)
      return c.json(await withPermissions(profile))
    } catch {
      return errorResponse(c, new ApiError(401, 'unauthenticated', 'Invalid or expired token.'))
    }
  })

  return router
}
