import { Hono, type MiddlewareHandler } from 'hono'
import { getCookie } from 'hono/cookie'
import type { AdminRole } from '@nailly/shared'
import { loadEnv } from '../config/env'
import { verifyAdminToken, type AdminProfile } from '../http/auth'
import { ApiError, errorResponse } from '../http/errors'
import { canAccessRole } from '../http/rbac'
import { createAdminRepository } from '../repositories/admin.repository'
import { RedisJsonCache } from '../cache/redis'
import { createAdminService } from '../services/admin.service'
import { assertSupportedImage } from '../services/media.service'
import { createMinioStorage } from '../storage/minio'

type AdminEnv = { Variables: { adminUser: AdminProfile } }

export function adminRoutes(
  cache = new RedisJsonCache(),
  repository = createAdminRepository()
) {
  const router = new Hono<AdminEnv>()
  const service = createAdminService(repository, cache)

  // Auth middleware
  router.use('*', async (c, next) => {
    const env = loadEnv()
    const token = getCookie(c, env.AUTH_COOKIE_NAME)

    if (!token) {
      return errorResponse(c, new ApiError(401, 'unauthenticated', 'Not authenticated.'))
    }

    try {
      const profile = await verifyAdminToken(token, env.AUTH_JWT_SECRET)
      c.set('adminUser', profile)
      await next()
    } catch {
      return errorResponse(c, new ApiError(401, 'unauthenticated', 'Invalid or expired token.'))
    }
  })

  // Role guard helper
  function guard(...roles: AdminRole[]): MiddlewareHandler<AdminEnv> {
    return async (c, next) => {
      const user = c.get('adminUser')
      if (!user || !canAccessRole(user.role as AdminRole, roles)) {
        return errorResponse(c, new ApiError(403, 'forbidden', 'Insufficient permissions.'))
      }
      await next()
    }
  }

  // Bookings (staff+)
  router.get('/bookings', guard('staff'), async (c) => {
    const status = c.req.query('status')
    const result = await service.listBookings(status ? { status } : undefined)
    return c.json(result)
  })

  router.get('/bookings/:id', guard('staff'), async (c) => {
    const booking = await service.getBooking(c.req.param('id'))
    if (!booking) {
      return errorResponse(c, new ApiError(404, 'not_found', 'Booking not found.'))
    }
    return c.json(booking)
  })

  router.patch('/bookings/:id', guard('staff'), async (c) => {
    const body = await c.req.json()
    const booking = await service.updateBooking(c.req.param('id'), body)
    if (!booking) {
      return errorResponse(c, new ApiError(404, 'not_found', 'Booking not found.'))
    }
    return c.json(booking)
  })

  router.patch('/bookings/:id/status', guard('staff'), async (c) => {
    const { status } = await c.req.json<{ status: string }>()
    const booking = await service.updateBookingStatus(c.req.param('id'), status)
    if (!booking) {
      return errorResponse(c, new ApiError(404, 'not_found', 'Booking not found.'))
    }
    return c.json(booking)
  })

  // Service Categories (manager+)
  router.get('/service-categories', guard('manager'), async (c) => {
    const result = await service.listServiceCategories()
    return c.json(result)
  })

  router.post('/service-categories', guard('manager'), async (c) => {
    const body = await c.req.json()
    const result = await service.createServiceCategory(body)
    return c.json(result, 201)
  })

  router.patch('/service-categories/:id', guard('manager'), async (c) => {
    const body = await c.req.json()
    const result = await service.updateServiceCategory(c.req.param('id'), body)
    if (!result) {
      return errorResponse(c, new ApiError(404, 'not_found', 'Category not found.'))
    }
    return c.json(result)
  })

  // Services (manager+)
  router.get('/services', guard('manager'), async (c) => {
    const result = await service.listServices()
    return c.json(result)
  })

  router.post('/services', guard('manager'), async (c) => {
    const body = await c.req.json()
    const result = await service.createService(body)
    return c.json(result, 201)
  })

  router.patch('/services/:id', guard('manager'), async (c) => {
    const body = await c.req.json()
    const result = await service.updateService(c.req.param('id'), body)
    if (!result) {
      return errorResponse(c, new ApiError(404, 'not_found', 'Service not found.'))
    }
    return c.json(result)
  })

  // Staff (manager+)
  router.get('/staff', guard('manager'), async (c) => {
    const result = await service.listStaff()
    return c.json(result)
  })

  router.post('/staff', guard('manager'), async (c) => {
    const body = await c.req.json()
    const { serviceIds, ...staffData } = body
    const result = await service.createStaff(staffData)
    if (serviceIds && Array.isArray(serviceIds)) {
      await service.setStaffServices(result.id, serviceIds)
    }
    return c.json(result, 201)
  })

  router.patch('/staff/:id', guard('manager'), async (c) => {
    const body = await c.req.json()
    const { serviceIds, ...staffData } = body
    const result = await service.updateStaff(c.req.param('id'), staffData)
    if (!result) {
      return errorResponse(c, new ApiError(404, 'not_found', 'Staff not found.'))
    }
    if (serviceIds && Array.isArray(serviceIds)) {
      await service.setStaffServices(c.req.param('id'), serviceIds)
    }
    return c.json(result)
  })

  // Shop Settings (manager+)
  router.get('/shop-settings', guard('manager'), async (c) => {
    const result = await service.getShopSettings()
    return c.json(result)
  })

  router.patch('/shop-settings', guard('manager'), async (c) => {
    const body = await c.req.json()
    const result = await service.updateShopSettings(body)
    return c.json(result)
  })

  // Admin Users (owner only)
  router.get('/admin-users', guard('owner'), async (c) => {
    const result = await service.listAdminUsers()
    return c.json(result)
  })

  router.post('/admin-users', guard('owner'), async (c) => {
    const body = await c.req.json()
    const bcrypt = await import('bcryptjs')
    const passwordHash = await bcrypt.hash(body.password, 10)
    const { password, ...rest } = body
    const result = await service.createAdminUser({ ...rest, passwordHash })
    return c.json(result, 201)
  })

  // Media (manager+)
  router.get('/media', guard('manager'), async (c) => {
    const result = await service.listMedia()
    return c.json(result)
  })

  router.post('/media', guard('manager'), async (c) => {
    const body = await c.req.parseBody()
    const file = body.file as File | undefined
    const altText = (body.altText as string) ?? ''
    const usageType = (body.usageType as string) ?? 'gallery'

    if (!file) {
      return errorResponse(c, new ApiError(400, 'bad_request', 'File is required.'))
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    assertSupportedImage({ contentType: file.type, sizeBytes: file.size })

    const storage = createMinioStorage()
    const ext = file.type === 'image/jpeg' ? 'jpg' : file.type === 'image/png' ? 'png' : 'webp'
    const objectKey = `uploads/${Date.now()}-${crypto.randomUUID()}.${ext}`

    const { publicUrl } = await storage.uploadObject({
      objectKey,
      buffer,
      contentType: file.type
    })

    const result = await service.createMedia({
      objectKey,
      publicUrl,
      contentType: file.type,
      sizeBytes: file.size,
      altText,
      usageType
    })

    return c.json(result, 201)
  })

  router.patch('/media/:id', guard('manager'), async (c) => {
    const body = await c.req.json()
    const result = await service.updateMedia(c.req.param('id'), body)
    if (!result) {
      return errorResponse(c, new ApiError(404, 'not_found', 'Media not found.'))
    }
    return c.json(result)
  })

  return router
}
