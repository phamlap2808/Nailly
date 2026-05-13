import { Hono } from 'hono'
import { getCookie } from 'hono/cookie'
import { loadEnv } from '../config/env'
import { signAdminToken, verifyAdminToken, setAdminCookie, clearAdminCookie } from '../http/auth'
import { ApiError, errorResponse } from '../http/errors'
import { createAdminUserRepository } from '../repositories/admin-user.repository'
import { AuthService } from '../services/auth.service'

export function authRoutes(
  authService = new AuthService(createAdminUserRepository())
) {
  const router = new Hono()

  router.post('/login', async (c) => {
    const { email, password } = await c.req.json<{ email: string; password: string }>()
    const profile = await authService.login(email, password)
    const env = loadEnv()
    const token = await signAdminToken(profile, env.AUTH_JWT_SECRET)
    setAdminCookie(c, token)

    return c.json(profile)
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
      return c.json(profile)
    } catch {
      return errorResponse(c, new ApiError(401, 'unauthenticated', 'Invalid or expired token.'))
    }
  })

  return router
}
