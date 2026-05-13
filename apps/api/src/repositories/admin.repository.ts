import { eq } from 'drizzle-orm'
import { bookingStatusSchema } from '@nailly/shared'
import { createDb } from '../db/client'
import {
  adminUsers,
  bookings,
  bookingServices,
  mediaAssets,
  serviceCategories,
  services,
  shopSettings,
  staff,
  staffServices
} from '../db/schema'

export function createAdminRepository(databaseUrl?: string) {
  const { db } = createDb(databaseUrl)

  return {
    // Bookings
    async listBookings(filters?: { status?: string }) {
      const conditions = []
      if (filters?.status) {
        conditions.push(eq(bookings.status, filters.status as any))
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

    async createStaff(input: { name: string; title: string; bio: string }) {
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
        .set({ ...input, updatedAt: new Date() })
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
    }
  }
}
