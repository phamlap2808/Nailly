import { Hono, type MiddlewareHandler } from 'hono'
import { getCookie } from 'hono/cookie'
import {
  adminPermissionSchema,
  adminRoleSchema,
  bannerPatchSchema,
  bannerSchema,
  promotionSchema,
  type AdminPermission
} from '@nailly/shared'
import { loadEnv } from '../config/env'
import { verifyAdminToken, type AdminProfile } from '../http/auth'
import { ApiError, errorResponse } from '../http/errors'
import { canAccessPermission, resolveRolePermissions } from '../http/rbac'
import { createAdminRepository } from '../repositories/admin.repository'
import { createFinanceRepository } from '../repositories/finance.repository'
import { RedisJsonCache } from '../cache/redis'
import { createAdminService } from '../services/admin.service'
import { invoicesToCsv, paymentsToCsv, payrollToCsv, refundsToCsv } from '../services/finance-export'
import { createFinanceService } from '../services/finance.service'
import { assertSupportedImage } from '../services/media.service'
import { createMinioStorage } from '../storage/minio'

type AdminEnv = { Variables: { adminUser: AdminProfile } }

export function adminRoutes(
  cache = new RedisJsonCache(),
  repository = createAdminRepository()
) {
  const router = new Hono<AdminEnv>()
  const service = createAdminService(repository, cache)
  const financeRepository = createFinanceRepository()
  const financeService = createFinanceService(financeRepository)

  // Auth middleware
  router.use('*', async (c, next) => {
    const env = loadEnv()
    const token = getCookie(c, env.AUTH_COOKIE_NAME)

    if (!token) {
      return errorResponse(c, new ApiError(401, 'unauthenticated', 'Not authenticated.'))
    }

    try {
      const profile = await verifyAdminToken(token, env.AUTH_JWT_SECRET)
      const role = adminRoleSchema.parse(profile.role)
      const permissionRows = await repository.getRolePermissionRows(role)
      c.set('adminUser', {
        ...profile,
        role,
        permissions: resolveRolePermissions(role, permissionRows)
      })
      await next()
    } catch {
      return errorResponse(c, new ApiError(401, 'unauthenticated', 'Invalid or expired token.'))
    }
  })

  // Permission guard helper
  function guard(permission: AdminPermission): MiddlewareHandler<AdminEnv> {
    return async (c, next) => {
      const user = c.get('adminUser')
      if (!user || !canAccessPermission(user.permissions, permission)) {
        return errorResponse(c, new ApiError(403, 'forbidden', 'Insufficient permissions.'))
      }
      await next()
    }
  }

  // Bookings
  router.get('/bookings', guard('bookings.view'), async (c) => {
    const status = c.req.query('status')
    const result = await service.listBookings(status ? { status } : undefined)
    return c.json(result)
  })

  router.get('/bookings/:id', guard('bookings.view'), async (c) => {
    const booking = await service.getBooking(c.req.param('id'))
    if (!booking) {
      return errorResponse(c, new ApiError(404, 'not_found', 'Booking not found.'))
    }
    return c.json(booking)
  })

  router.patch('/bookings/:id', guard('bookings.update'), async (c) => {
    const body = await c.req.json()
    const booking = await service.updateBooking(c.req.param('id'), body)
    if (!booking) {
      return errorResponse(c, new ApiError(404, 'not_found', 'Booking not found.'))
    }
    return c.json(booking)
  })

  router.patch('/bookings/:id/status', guard('bookings.update'), async (c) => {
    const { status } = await c.req.json<{ status: string }>()
    const booking = await service.updateBookingStatus(c.req.param('id'), status)
    if (!booking) {
      return errorResponse(c, new ApiError(404, 'not_found', 'Booking not found.'))
    }
    return c.json(booking)
  })

  // Service Categories
  router.get('/service-categories', guard('catalog.view'), async (c) => {
    const result = await service.listServiceCategories()
    return c.json(result)
  })

  router.post('/service-categories', guard('catalog.manage'), async (c) => {
    const body = await c.req.json()
    const result = await service.createServiceCategory(body)
    return c.json(result, 201)
  })

  router.patch('/service-categories/:id', guard('catalog.manage'), async (c) => {
    const body = await c.req.json()
    const result = await service.updateServiceCategory(c.req.param('id'), body)
    if (!result) {
      return errorResponse(c, new ApiError(404, 'not_found', 'Category not found.'))
    }
    return c.json(result)
  })

  // Services
  router.get('/services', guard('catalog.view'), async (c) => {
    const result = await service.listServices()
    return c.json(result)
  })

  router.post('/services', guard('catalog.manage'), async (c) => {
    const body = await c.req.json()
    const result = await service.createService(body)
    return c.json(result, 201)
  })

  router.patch('/services/:id', guard('catalog.manage'), async (c) => {
    const body = await c.req.json()
    const result = await service.updateService(c.req.param('id'), body)
    if (!result) {
      return errorResponse(c, new ApiError(404, 'not_found', 'Service not found.'))
    }
    return c.json(result)
  })

  // Staff
  router.get('/staff', guard('staff.view'), async (c) => {
    const result = await service.listStaff()
    return c.json(result)
  })

  router.post('/staff', guard('staff.manage'), async (c) => {
    const body = await c.req.json()
    const { serviceIds, ...staffData } = body
    const result = await service.createStaff(staffData)
    if (serviceIds && Array.isArray(serviceIds)) {
      await service.setStaffServices(result.id, serviceIds)
    }
    return c.json(result, 201)
  })

  router.patch('/staff/:id', guard('staff.manage'), async (c) => {
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

  // Shop Settings
  router.get('/shop-settings', guard('settings.view'), async (c) => {
    const result = await service.getShopSettings()
    return c.json(result)
  })

  router.patch('/shop-settings', guard('settings.manage'), async (c) => {
    const body = await c.req.json()
    const result = await service.updateShopSettings(body)
    return c.json(result)
  })

  // Admin Users
  router.get('/admin-users', guard('users.view'), async (c) => {
    const result = await service.listAdminUsers()
    return c.json(result)
  })

  router.post('/admin-users', guard('users.manage'), async (c) => {
    const body = await c.req.json()
    const bcrypt = await import('bcryptjs')
    const passwordHash = await bcrypt.hash(body.password, 10)
    const { password, ...rest } = body
    const result = await service.createAdminUser({ ...rest, passwordHash })
    return c.json(result, 201)
  })

  // Permissions
  router.get('/permissions', guard('permissions.manage'), async (c) => {
    const rows = await service.listRolePermissions()
    const groupedRows = {
      owner: rows.filter((row) => row.role === 'owner'),
      manager: rows.filter((row) => row.role === 'manager'),
      staff: rows.filter((row) => row.role === 'staff')
    }

    return c.json({
      permissions: adminPermissionSchema.options,
      roles: {
        owner: resolveRolePermissions('owner', groupedRows.owner),
        manager: resolveRolePermissions('manager', groupedRows.manager),
        staff: resolveRolePermissions('staff', groupedRows.staff)
      }
    })
  })

  router.patch('/permissions', guard('permissions.manage'), async (c) => {
    const body = await c.req.json<{ role: string; permissions: string[] }>()
    const role = adminRoleSchema.parse(body.role)

    if (role === 'owner') {
      return errorResponse(c, new ApiError(400, 'bad_request', 'Owner permissions are always enabled.'))
    }

    const permissions = body.permissions.map((permission) => adminPermissionSchema.parse(permission))
    const rows = await service.replaceRolePermissions(role, permissions)

    return c.json({
      role,
      permissions: resolveRolePermissions(role, rows)
    })
  })

  // Media
  router.get('/media', guard('media.view'), async (c) => {
    const result = await service.listMedia()
    return c.json(result)
  })

  router.post('/media', guard('media.manage'), async (c) => {
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

  router.patch('/media/:id', guard('media.manage'), async (c) => {
    const body = await c.req.json()
    const result = await service.updateMedia(c.req.param('id'), body)
    if (!result) {
      return errorResponse(c, new ApiError(404, 'not_found', 'Media not found.'))
    }
    return c.json(result)
  })

  // Banners
  router.get('/banners', guard('banners.view'), async (c) => {
    const result = await service.listBanners()
    return c.json(result)
  })

  router.post('/banners', guard('banners.manage'), async (c) => {
    const body = bannerSchema.parse(await c.req.json())
    const result = await service.createBanner(body)
    return c.json(result, 201)
  })

  router.patch('/banners/:id', guard('banners.manage'), async (c) => {
    const body = bannerPatchSchema.parse(await c.req.json())
    const result = await service.updateBanner(c.req.param('id'), body)
    if (!result) {
      return errorResponse(c, new ApiError(404, 'not_found', 'Banner not found.'))
    }
    return c.json(result)
  })

  // Finance
  router.get('/promotions', guard('promotions.view'), async (c) => {
    const result = await financeRepository.listPromotions()
    return c.json(result)
  })

  router.post('/promotions', guard('promotions.manage'), async (c) => {
    const body = promotionSchema.parse(await c.req.json())
    const result = await financeRepository.createPromotion(body)
    return c.json(result, 201)
  })

  router.patch('/promotions/:id', guard('promotions.manage'), async (c) => {
    const body = promotionSchema.parse(await c.req.json())
    const result = await financeRepository.updatePromotion(c.req.param('id'), body)
    if (!result) {
      return errorResponse(c, new ApiError(404, 'not_found', 'Promotion not found.'))
    }
    return c.json(result)
  })

  router.get('/invoices', guard('invoices.view'), async (c) => {
    const result = await financeRepository.listInvoices()
    return c.json(result)
  })

  router.post('/invoices', guard('invoices.create'), async (c) => {
    const body = await c.req.json()
    const user = c.get('adminUser')
    const result = await financeService.createInvoice(body, { adminUserId: user.id })
    return c.json(result, 201)
  })

  router.get('/invoices/:id', guard('invoices.view'), async (c) => {
    const invoice = await financeRepository.getInvoiceWithItems(c.req.param('id'))
    if (!invoice) {
      return errorResponse(c, new ApiError(404, 'not_found', 'Invoice not found.'))
    }
    return c.json(invoice)
  })

  router.post('/invoices/:id/payments', guard('invoices.pay'), async (c) => {
    const user = c.get('adminUser')
    const result = await financeService.addPayment(c.req.param('id'), await c.req.json(), {
      adminUserId: user.id
    })
    return c.json(result, 201)
  })

  router.post('/invoices/:id/refunds', guard('invoices.refund'), async (c) => {
    const user = c.get('adminUser')
    const result = await financeService.refundInvoice(c.req.param('id'), await c.req.json(), {
      adminUserId: user.id
    })
    return c.json(result, 201)
  })

  router.post('/invoices/:id/void', guard('invoices.void'), async (c) => {
    const user = c.get('adminUser')
    const { reason } = await c.req.json<{ reason: string }>()
    const result = await financeService.voidInvoice(c.req.param('id'), reason, {
      adminUserId: user.id
    })
    return c.json(result)
  })

  router.get('/reports/revenue', guard('reports.view'), async (c) => {
    const result = await financeRepository.getRevenueReport()
    return c.json(result)
  })

  router.get('/exports/invoices.csv', guard('reports.export'), async () => {
    const rows = await financeRepository.listInvoices()
    return new Response(invoicesToCsv(rows), {
      headers: {
        'content-type': 'text/csv; charset=utf-8',
        'content-disposition': 'attachment; filename="invoices.csv"'
      }
    })
  })

  router.get('/exports/payments.csv', guard('reports.export'), async () => {
    const rows = await financeRepository.listPayments()
    return new Response(paymentsToCsv(rows), {
      headers: {
        'content-type': 'text/csv; charset=utf-8',
        'content-disposition': 'attachment; filename="payments.csv"'
      }
    })
  })

  router.get('/exports/refunds.csv', guard('reports.export'), async () => {
    const rows = await financeRepository.listRefunds()
    return new Response(refundsToCsv(rows), {
      headers: {
        'content-type': 'text/csv; charset=utf-8',
        'content-disposition': 'attachment; filename="refunds.csv"'
      }
    })
  })

  router.get('/exports/payroll.csv', guard('reports.export'), async () => {
    const report = await financeRepository.getRevenueReport()
    return new Response(payrollToCsv(report.payrollRows), {
      headers: {
        'content-type': 'text/csv; charset=utf-8',
        'content-disposition': 'attachment; filename="payroll.csv"'
      }
    })
  })

  return router
}
