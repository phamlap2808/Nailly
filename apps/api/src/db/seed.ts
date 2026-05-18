import bcrypt from 'bcryptjs'
import { eq } from 'drizzle-orm'
import * as Minio from 'minio'
import { loadEnv } from '../config/env'
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

async function seed() {
  const { client, db } = createDb()

  // Small delay to ensure MinIO is ready after init
  await new Promise((r) => setTimeout(r, 2000))

  const mc = createMinioClient()

  // Ensure MinIO bucket exists and seed media
  await ensureBucket(mc)
  await seedMediaObjects(mc, db)

  // Clear tables in dependency order
  await db.delete(schema.bookingServices)
  await db.delete(schema.bookings)
  await db.delete(schema.availabilityRules)
  await db.delete(schema.staffServices)
  await db.delete(schema.staff)
  await db.delete(schema.services)
  await db.delete(schema.serviceCategories)
  await db.delete(schema.adminUsers)
  await db.delete(schema.mediaAssets)
  await db.delete(schema.shopSettings)

  // Insert shop
  await db.insert(schema.shopSettings).values(demoSeed.shop)
  console.log('Inserted: 1 shop')

  // Insert media (re-insert after delete)
  await seedMediaObjects(mc, db)
  console.log(`Inserted: ${demoSeed.media.length} media assets`)

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
  for (const st of demoSeed.staff) {
    const [row] = await db
      .insert(schema.staff)
      .values({
        name: st.name,
        title: st.title,
        bio: st.bio,
        active: true
      })
      .returning({ id: schema.staff.id })
    staffIds.set(st.name, row.id)
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

  // Insert demo bookings to make the booking UI show realistic blocked slots
  for (const bookingDemo of demoSeed.bookings) {
    const staffId = staffIds.get(bookingDemo.staffName)
    if (!staffId) {
      throw new Error(`Unknown booking staff: ${bookingDemo.staffName}`)
    }

    const bookingServiceIds = bookingDemo.serviceNames.map((serviceName) => {
      const serviceId = serviceIds.get(serviceName)
      if (!serviceId) {
        throw new Error(`Unknown booking service: ${serviceName}`)
      }
      return serviceId
    })

    const durationMinutes = bookingDemo.serviceNames.reduce((sum, serviceName) => {
      const duration = serviceDurations.get(serviceName)
      if (!duration) {
        throw new Error(`Unknown booking service duration: ${serviceName}`)
      }
      return sum + duration
    }, 0)

    const [booking] = await db
      .insert(schema.bookings)
      .values({
        staffId,
        customerName: bookingDemo.customerName,
        phone: bookingDemo.phone,
        email: bookingDemo.email,
        partySize: bookingDemo.partySize,
        appointmentDate: dateFromOffset(bookingDemo.relativeDayOffset),
        startTime: bookingDemo.startTime,
        endTime: minutesToTime(timeToMinutes(bookingDemo.startTime) + durationMinutes),
        status: bookingDemo.status,
        note: bookingDemo.note
      })
      .returning({ id: schema.bookings.id })

    await db.insert(schema.bookingServices).values(
      bookingServiceIds.map((serviceId) => ({
        bookingId: booking.id,
        serviceId
      }))
    )
  }
  console.log(`Inserted: ${demoSeed.bookings.length} demo bookings`)

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

  await client.end()
  console.log('Seed complete.')
}

seed().catch((error) => {
  console.error('Seed failed:', error)
  process.exit(1)
})
