import { eq } from 'drizzle-orm'
import {
  adminPermissionValues,
  bookingStatusSchema,
  type AdminPermission,
  type AdminRole
} from '@nailly/shared'
import { createDb } from '../db/client'
import {
  adminUsers,
  banners,
  bookings,
  bookingServices,
  mediaAssets,
  rolePermissions,
  serviceCategories,
  services,
  shopSettings,
  staff,
  staffServices
} from '../db/schema'

interface ShopSettingsUpdateValues {
  name?: string
  locale?: string
  tagline?: string
  description?: string
  phone?: string
  email?: string | null
  address?: string
  mapUrl?: string | null
  openingHours?: Record<string, string>
  taxRateBps?: number
  receiptFooter?: string
  invoicePrefix?: string
  seoTitle?: string
  seoDescription?: string
  updatedAt: Date
}

function isStringRecord(value: unknown): value is Record<string, string> {
  return Boolean(
    value &&
      typeof value === 'object' &&
      !Array.isArray(value) &&
      Object.values(value).every((item) => typeof item === 'string')
  )
}

export function buildShopSettingsUpdateValues(input: Record<string, unknown>): ShopSettingsUpdateValues {
  const values: ShopSettingsUpdateValues = { updatedAt: new Date() }

  if (typeof input.name === 'string') values.name = input.name
  if (typeof input.locale === 'string') values.locale = input.locale
  if (typeof input.tagline === 'string') values.tagline = input.tagline
  if (typeof input.description === 'string') values.description = input.description
  if (typeof input.phone === 'string') values.phone = input.phone
  if (input.email === null || typeof input.email === 'string') values.email = input.email
  if (typeof input.address === 'string') values.address = input.address
  if (input.mapUrl === null || typeof input.mapUrl === 'string') values.mapUrl = input.mapUrl
  if (isStringRecord(input.openingHours)) values.openingHours = input.openingHours
  if (typeof input.taxRateBps === 'number') values.taxRateBps = input.taxRateBps
  if (typeof input.receiptFooter === 'string') values.receiptFooter = input.receiptFooter
  if (typeof input.invoicePrefix === 'string') values.invoicePrefix = input.invoicePrefix
  if (typeof input.seoTitle === 'string') values.seoTitle = input.seoTitle
  if (typeof input.seoDescription === 'string') {
    values.seoDescription = input.seoDescription
  }

  return values
}

export function buildRolePermissionRows(role: AdminRole, enabledPermissions: readonly AdminPermission[]) {
  const enabledSet = new Set(enabledPermissions)

  return adminPermissionValues.map((permission) => ({
    role,
    permission,
    enabled: enabledSet.has(permission)
  }))
}

export function createAdminRepository(databaseUrl?: string) {
  const { db } = createDb(databaseUrl)

  async function getRolePermissionRows(role: AdminRole) {
    return db
      .select({
        permission: rolePermissions.permission,
        enabled: rolePermissions.enabled
      })
      .from(rolePermissions)
      .where(eq(rolePermissions.role, role))
  }

  async function replaceRolePermissions(role: AdminRole, permissions: AdminPermission[]) {
    await db.delete(rolePermissions).where(eq(rolePermissions.role, role))
    await db.insert(rolePermissions).values(buildRolePermissionRows(role, permissions))
    return getRolePermissionRows(role)
  }

  return {
    // Bookings
    async listBookings(filters?: { status?: string }) {
      if (filters?.status) {
        const status = bookingStatusSchema.parse(filters.status)
        return db
          .select()
          .from(bookings)
          .where(eq(bookings.status, status))
          .orderBy(bookings.appointmentDate, bookings.startTime)
      }
      return db.select().from(bookings).orderBy(bookings.appointmentDate, bookings.startTime)
    },

    async getBooking(id: string) {
      const rows = await db.select().from(bookings).where(eq(bookings.id, id)).limit(1)
      return rows[0] ?? null
    },

    async updateBooking(id: string, input: Record<string, unknown>) {
      const [row] = await db
        .update(bookings)
        .set({ ...input, updatedAt: new Date() })
        .where(eq(bookings.id, id))
        .returning()
      return row ?? null
    },

    async updateBookingStatus(id: string, status: string) {
      const parsed = bookingStatusSchema.parse(status)
      const [row] = await db
        .update(bookings)
        .set({ status: parsed, updatedAt: new Date() })
        .where(eq(bookings.id, id))
        .returning()
      return row ?? null
    },

    // Service Categories
    async listServiceCategories() {
      return db.select().from(serviceCategories).orderBy(serviceCategories.sortOrder)
    },

    async createServiceCategory(input: { name: string; description: string; sortOrder?: number }) {
      const [row] = await db.insert(serviceCategories).values(input).returning()
      return row
    },

    async updateServiceCategory(id: string, input: Record<string, unknown>) {
      const [row] = await db
        .update(serviceCategories)
        .set({ ...input, updatedAt: new Date() })
        .where(eq(serviceCategories.id, id))
        .returning()
      return row ?? null
    },

    // Services
    async listServices() {
      return db.select().from(services).orderBy(services.sortOrder)
    },

    async createService(input: {
      categoryId: string
      name: string
      description: string
      durationMinutes: number
      priceCents: number
      sortOrder?: number
    }) {
      const [row] = await db.insert(services).values(input).returning()
      return row
    },

    async updateService(id: string, input: Record<string, unknown>) {
      const [row] = await db
        .update(services)
        .set({ ...input, updatedAt: new Date() })
        .where(eq(services.id, id))
        .returning()
      return row ?? null
    },

    // Staff
    async listStaff() {
      return db.select().from(staff)
    },

    async createStaff(input: { name: string; title: string; bio: string; commissionRateBps?: number }) {
      const [row] = await db.insert(staff).values(input).returning()
      return row
    },

    async updateStaff(id: string, input: Record<string, unknown>) {
      const [row] = await db
        .update(staff)
        .set({ ...input, updatedAt: new Date() })
        .where(eq(staff.id, id))
        .returning()
      return row ?? null
    },

    async setStaffServices(staffId: string, serviceIds: string[]) {
      await db.delete(staffServices).where(eq(staffServices.staffId, staffId))
      if (serviceIds.length > 0) {
        await db.insert(staffServices).values(
          serviceIds.map((serviceId) => ({ staffId, serviceId }))
        )
      }
    },

    // Shop Settings
    async getShopSettings() {
      const rows = await db.select().from(shopSettings).limit(1)
      return rows[0] ?? null
    },

    async updateShopSettings(input: Record<string, unknown>) {
      const [row] = await db
        .update(shopSettings)
        .set(buildShopSettingsUpdateValues(input))
        .where(eq(shopSettings.id, shopSettings.id)) // always update first row
        .returning()
      return row ?? null
    },

    // Admin Users
    async listAdminUsers() {
      return db.select({
        id: adminUsers.id,
        email: adminUsers.email,
        name: adminUsers.name,
        role: adminUsers.role,
        active: adminUsers.active,
        createdAt: adminUsers.createdAt
      }).from(adminUsers)
    },

    async createAdminUser(input: {
      email: string
      passwordHash: string
      name: string
      role: 'owner' | 'manager' | 'staff'
    }) {
      const [row] = await db.insert(adminUsers).values(input).returning({
        id: adminUsers.id,
        email: adminUsers.email,
        name: adminUsers.name,
        role: adminUsers.role,
        active: adminUsers.active
      })
      return row
    },

    // Permissions
    async listRolePermissions() {
      return db.select().from(rolePermissions).orderBy(rolePermissions.role, rolePermissions.permission)
    },

    getRolePermissionRows,
    replaceRolePermissions,

    // Media
    async listMedia() {
      return db.select().from(mediaAssets).orderBy(mediaAssets.createdAt)
    },

    async createMedia(input: {
      objectKey: string
      publicUrl: string
      contentType: string
      sizeBytes: number
      altText: string
      usageType: string
    }) {
      const [row] = await db.insert(mediaAssets).values(input).returning()
      return row
    },

    async updateMedia(id: string, input: Record<string, unknown>) {
      const [row] = await db
        .update(mediaAssets)
        .set({ ...input, updatedAt: new Date() })
        .where(eq(mediaAssets.id, id))
        .returning()
      return row ?? null
    },

    // Banners
    async listBanners() {
      return db
        .select({
          id: banners.id,
          imageId: banners.imageId,
          eyebrow: banners.eyebrow,
          title: banners.title,
          subtitle: banners.subtitle,
          primaryLabel: banners.primaryLabel,
          primaryHref: banners.primaryHref,
          secondaryLabel: banners.secondaryLabel,
          secondaryHref: banners.secondaryHref,
          sortOrder: banners.sortOrder,
          active: banners.active,
          imageUrl: mediaAssets.publicUrl,
          imageAltText: mediaAssets.altText,
          createdAt: banners.createdAt,
          updatedAt: banners.updatedAt
        })
        .from(banners)
        .leftJoin(mediaAssets, eq(banners.imageId, mediaAssets.id))
        .orderBy(banners.sortOrder, banners.createdAt)
    },

    async createBanner(input: {
      imageId?: string | null
      eyebrow?: string | null
      title: string
      subtitle?: string | null
      primaryLabel?: string
      primaryHref?: string
      secondaryLabel?: string | null
      secondaryHref?: string | null
      sortOrder?: number
      active?: boolean
    }) {
      const [row] = await db
        .insert(banners)
        .values({
          imageId: input.imageId ?? null,
          eyebrow: input.eyebrow ?? '',
          title: input.title,
          subtitle: input.subtitle ?? '',
          primaryLabel: input.primaryLabel ?? 'Book appointment',
          primaryHref: input.primaryHref ?? '/booking',
          secondaryLabel: input.secondaryLabel ?? null,
          secondaryHref: input.secondaryHref ?? null,
          sortOrder: input.sortOrder ?? 0,
          active: input.active ?? true
        })
        .returning()
      return row
    },

    async updateBanner(id: string, input: Record<string, unknown>) {
      const [row] = await db
        .update(banners)
        .set({ ...input, updatedAt: new Date() })
        .where(eq(banners.id, id))
        .returning()
      return row ?? null
    }
  }
}
