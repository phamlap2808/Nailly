import bcrypt from 'bcryptjs'
import { eq } from 'drizzle-orm'
import * as Minio from 'minio'
import { adminRoleValues, defaultRolePermissions } from '@nailly/shared'
import { loadEnv } from '../config/env'
import { calculateInvoiceTotals } from '../services/finance-math'
import { createDb } from './client'
import * as schema from './schema'
import { demoSeed } from './seed-data'

const env = loadEnv()

function createMinioClient() {
  return new Minio.Client({
    endPoint: env.MINIO_ENDPOINT,
    port: env.MINIO_PORT,
    useSSL: env.MINIO_USE_SSL,
    accessKey: env.MINIO_ACCESS_KEY,
    secretKey: env.MINIO_SECRET_KEY
  })
}

const demoPng = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=',
  'base64'
)

async function ensureBucket(mc: Minio.Client) {
  const exists = await mc.bucketExists(env.MINIO_BUCKET)
  if (!exists) {
    await mc.makeBucket(env.MINIO_BUCKET)
  }
}

async function seedMediaObjects(mc: Minio.Client, db: ReturnType<typeof createDb>['db']) {
  for (const item of demoSeed.media) {
    const existing = await db
      .select({ id: schema.mediaAssets.id })
      .from(schema.mediaAssets)
      .where(eq(schema.mediaAssets.objectKey, item.key))
      .limit(1)

    if (existing.length > 0) continue

    await mc.putObject(env.MINIO_BUCKET, item.key, demoPng, demoPng.length, {
      'Content-Type': item.contentType
    })

    await db.insert(schema.mediaAssets).values({
      objectKey: item.key,
      publicUrl: item.publicUrl,
      contentType: item.contentType,
      sizeBytes: item.sizeBytes,
      altText: item.altText,
      usageType: item.usageType
    })
  }
}

function toMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

function timeToMinutes(time: string): number {
  return toMinutes(time)
}

function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`
}

function dateFromOffset(offset: number): string {
  const date = new Date()
  date.setDate(date.getDate() + offset)
  return date.toISOString().slice(0, 10)
}

function requiredLookup<T>(map: Map<string, T>, key: string, label: string): T {
  const value = map.get(key)
  if (value === undefined) {
    throw new Error(`Missing ${label} for demo seed reference: ${key}`)
  }

  return value
}

async function seed() {
  const { client, db } = createDb()

  // Small delay to ensure MinIO is ready after init
  await new Promise((r) => setTimeout(r, 2000))

  const mc = createMinioClient()

  // Ensure MinIO bucket exists and seed media
  await ensureBucket(mc)
  await seedMediaObjects(mc, db)

  // Clear tables in dependency order
  await db.delete(schema.refunds)
  await db.delete(schema.payments)
  await db.delete(schema.invoiceItems)
  await db.delete(schema.invoices)
  await db.delete(schema.bookingServices)
  await db.delete(schema.bookings)
  await db.delete(schema.promotions)
  await db.delete(schema.availabilityRules)
  await db.delete(schema.staffServices)
  await db.delete(schema.staff)
  await db.delete(schema.services)
  await db.delete(schema.serviceCategories)
  await db.delete(schema.rolePermissions)
  await db.delete(schema.adminUsers)
  await db.delete(schema.banners)
  await db.delete(schema.mediaAssets)
  await db.delete(schema.shopSettings)

  // Insert shop
  await db.insert(schema.shopSettings).values(demoSeed.shop)
  console.log('Inserted: 1 shop')

  await db.insert(schema.promotions).values(demoSeed.promotions)
  console.log(`Inserted: ${demoSeed.promotions.length} promotions`)

  // Insert media (re-insert after delete)
  await seedMediaObjects(mc, db)
  console.log(`Inserted: ${demoSeed.media.length} media assets`)

  const mediaRows = await db
    .select({ id: schema.mediaAssets.id, objectKey: schema.mediaAssets.objectKey })
    .from(schema.mediaAssets)
  const mediaIds = new Map(mediaRows.map((row) => [row.objectKey, row.id]))
  for (const banner of demoSeed.banners) {
    const imageId = requiredLookup(mediaIds, banner.imageKey, 'banner media')
    await db.insert(schema.banners).values({
      imageId,
      eyebrow: banner.eyebrow,
      title: banner.title,
      subtitle: banner.subtitle,
      primaryLabel: banner.primaryLabel,
      primaryHref: banner.primaryHref,
      secondaryLabel: banner.secondaryLabel,
      secondaryHref: banner.secondaryHref,
      sortOrder: banner.sortOrder,
      active: banner.active
    })
  }
  console.log(`Inserted: ${demoSeed.banners.length} banners`)

  // Insert categories
  const categoryIds = new Map<string, string>()
  for (const cat of demoSeed.categories) {
    const [row] = await db
      .insert(schema.serviceCategories)
      .values(cat)
      .returning({ id: schema.serviceCategories.id })
    categoryIds.set(cat.name, row.id)
  }
  console.log(`Inserted: ${demoSeed.categories.length} categories`)

  // Insert services
  const serviceIds = new Map<string, string>()
  const serviceDurations = new Map<string, number>()
  for (const svc of demoSeed.services) {
    const categoryId = categoryIds.get(svc.categoryName)!
    const [row] = await db
      .insert(schema.services)
      .values({
        categoryId,
        name: svc.name,
        description: svc.description,
        durationMinutes: svc.durationMinutes,
        priceCents: svc.priceCents,
        sortOrder: svc.sortOrder,
        active: true
      })
      .returning({ id: schema.services.id })
    serviceIds.set(svc.name, row.id)
    serviceDurations.set(svc.name, svc.durationMinutes)
  }
  console.log(`Inserted: ${demoSeed.services.length} services`)

  // Insert staff
  const staffIds = new Map<string, string>()
  const staffCommissionRates = new Map<string, number>()
  for (const st of demoSeed.staff) {
    const [row] = await db
      .insert(schema.staff)
      .values({
        name: st.name,
        title: st.title,
        bio: st.bio,
        commissionRateBps: st.commissionRateBps,
        active: true
      })
      .returning({ id: schema.staff.id })
    staffIds.set(st.name, row.id)
    staffCommissionRates.set(st.name, st.commissionRateBps)
  }
  console.log(`Inserted: ${demoSeed.staff.length} staff`)

  // Map all staff to all services
  for (const [, staffId] of staffIds) {
    for (const [, serviceId] of serviceIds) {
      await db.insert(schema.staffServices).values({ staffId, serviceId })
    }
  }
  console.log(
    `Inserted: ${staffIds.size * serviceIds.size} staff-service mappings`
  )

  // Insert demo bookings used by booking-sourced finance invoices
  const bookingIdsByCustomerName = new Map<string, string>()
  for (const booking of demoSeed.bookings) {
    const staffId = requiredLookup(staffIds, booking.staffName, 'staff')
    const bookingServiceIds = booking.serviceNames.map((serviceName) =>
      requiredLookup(serviceIds, serviceName, 'service')
    )
    const durationMinutes = booking.serviceNames.reduce(
      (sum, serviceName) => sum + requiredLookup(serviceDurations, serviceName, 'service duration'),
      0
    )
    const [row] = await db
      .insert(schema.bookings)
      .values({
        staffId,
        customerName: booking.customerName,
        phone: booking.phone,
        email: booking.email || null,
        partySize: booking.partySize,
        appointmentDate: dateFromOffset(booking.relativeDayOffset),
        startTime: booking.startTime,
        endTime: minutesToTime(timeToMinutes(booking.startTime) + durationMinutes),
        status: booking.status,
        promotionCode: booking.promotionCode ?? null,
        note: booking.note ?? null,
        source: 'public_web'
      })
      .returning({ id: schema.bookings.id })

    bookingIdsByCustomerName.set(booking.customerName, row.id)

    await db.insert(schema.bookingServices).values(
      bookingServiceIds.map((serviceId) => ({
        bookingId: row.id,
        serviceId
      }))
    )
  }
  console.log(`Inserted: ${demoSeed.bookings.length} bookings`)

  // Insert availability rules (weekdays 09:00-19:30, Saturday 09:00-18:00)
  for (const [, staffId] of staffIds) {
    for (let dayOfWeek = 1; dayOfWeek <= 5; dayOfWeek++) {
      await db.insert(schema.availabilityRules).values({
        staffId,
        dayOfWeek,
        startTime: '09:00',
        endTime: '19:30',
        active: true
      })
    }
    // Saturday
    await db.insert(schema.availabilityRules).values({
      staffId,
      dayOfWeek: 6,
      startTime: '09:00',
      endTime: '18:00',
      active: true
    })
  }
  console.log(`Inserted: ${staffIds.size * 6} availability rules`)

  // Insert finance invoices with items, payments, and refunds
  for (const invoiceDemo of demoSeed.financeInvoices) {
    await db.transaction(async (tx) => {
      const itemInputs = invoiceDemo.items.map((item, index) => {
        const serviceName = 'serviceName' in item && typeof item.serviceName === 'string' ? item.serviceName : undefined
        const staffName = 'staffName' in item && typeof item.staffName === 'string' ? item.staffName : undefined
        const manualName = 'name' in item && typeof item.name === 'string' ? item.name : undefined
        const serviceId = serviceName ? requiredLookup(serviceIds, serviceName, 'service') : null
        const staffId = staffName ? requiredLookup(staffIds, staffName, 'staff') : null
        const commissionRateBps = staffName ? requiredLookup(staffCommissionRates, staffName, 'staff commission rate') : 0
        const name = serviceName ?? manualName
        if (!name) {
          throw new Error(`Missing item name for demo invoice: ${invoiceDemo.invoiceNumber}`)
        }
        const lineTotalCents = item.quantity * item.unitPriceCents

        return {
          item,
          name,
          serviceId,
          staffId,
          commissionRateBps,
          lineTotalCents,
          sortOrder: index + 1
        }
      })

      const totals = calculateInvoiceTotals({
        items: itemInputs.map((input) => ({
          quantity: input.item.quantity,
          unitPriceCents: input.item.unitPriceCents,
          commissionRateBps: input.commissionRateBps
        })),
        discountCents: invoiceDemo.discountCents,
        taxRateBps: demoSeed.shop.taxRateBps,
        tipCents: invoiceDemo.tipCents,
        paidCents: invoiceDemo.payments.reduce((sum, payment) => sum + payment.amountCents, 0),
        refundedCents: invoiceDemo.refunds.reduce((sum, refund) => sum + refund.amountCents, 0)
      })

      const [invoice] = await tx
        .insert(schema.invoices)
        .values({
          invoiceNumber: invoiceDemo.invoiceNumber,
          source: invoiceDemo.source,
          bookingId: invoiceDemo.bookingCustomerName
            ? requiredLookup(bookingIdsByCustomerName, invoiceDemo.bookingCustomerName, 'booking')
            : null,
          customerName: invoiceDemo.customerName,
          customerPhone: invoiceDemo.customerPhone || null,
          customerEmail: invoiceDemo.customerEmail || null,
          status: invoiceDemo.status,
          subtotalCents: totals.subtotalCents,
          discountCents: totals.discountCents,
          discountReason: invoiceDemo.discountReason ?? null,
          taxRateBps: demoSeed.shop.taxRateBps,
          taxCents: totals.taxCents,
          tipCents: totals.tipCents,
          totalCents: totals.totalCents,
          paidCents: totals.paidCents,
          refundedCents: totals.refundedCents,
          issuedAt: new Date(),
          paidAt: invoiceDemo.status === 'paid' || invoiceDemo.status === 'partially_refunded' ? new Date() : null
        })
        .returning({ id: schema.invoices.id })

      await tx.insert(schema.invoiceItems).values(
        itemInputs.map((input, index) => ({
          invoiceId: invoice.id,
          itemType: input.item.itemType,
          serviceId: input.serviceId,
          staffId: input.staffId,
          name: input.name,
          description: null,
          quantity: input.item.quantity,
          unitPriceCents: input.item.unitPriceCents,
          lineTotalCents: input.lineTotalCents,
          commissionRateBps: input.commissionRateBps,
          commissionCents: totals.itemCommissions[index],
          sortOrder: input.sortOrder
        }))
      )

      const insertedPayments = [] as Array<{ id: string }>
      for (const payment of invoiceDemo.payments) {
        const [insertedPayment] = await tx
          .insert(schema.payments)
          .values({
            invoiceId: invoice.id,
            method: payment.method,
            amountCents: payment.amountCents,
            reference: 'reference' in payment ? payment.reference ?? null : null,
            note: null,
            paidAt: new Date()
          })
          .returning({ id: schema.payments.id })
        insertedPayments.push(insertedPayment)
      }

      for (const refund of invoiceDemo.refunds) {
        await tx.insert(schema.refunds).values({
          invoiceId: invoice.id,
          paymentId: insertedPayments[0]?.id ?? null,
          method: refund.method,
          amountCents: refund.amountCents,
          reason: refund.reason,
          refundedAt: new Date()
        })
      }
    })
  }
  console.log(`Inserted: ${demoSeed.financeInvoices.length} finance invoices`)
  console.log(
    `Inserted: ${demoSeed.financeInvoices.reduce((sum, invoice) => sum + invoice.payments.length, 0)} finance payments`
  )
  console.log(
    `Inserted: ${demoSeed.financeInvoices.reduce((sum, invoice) => sum + invoice.refunds.length, 0)} finance refunds`
  )

  // Insert admin users with hashed passwords
  for (const admin of demoSeed.adminUsers) {
    const passwordHash = await bcrypt.hash(admin.password, 10)
    await db.insert(schema.adminUsers).values({
      email: admin.email,
      passwordHash,
      name: admin.name,
      role: admin.role,
      active: true
    })
  }
  console.log(`Inserted: ${demoSeed.adminUsers.length} admin users`)

  await db.insert(schema.rolePermissions).values(
    adminRoleValues.flatMap((role) =>
      defaultRolePermissions[role].map((permission) => ({
        role,
        permission,
        enabled: true
      }))
    )
  )
  console.log('Inserted: default role permissions')

  await client.end()
  console.log('Seed complete.')
}

seed().catch((error) => {
  console.error('Seed failed:', error)
  process.exit(1)
})
