import bcrypt from 'bcryptjs'
import { eq } from 'drizzle-orm'
import * as Minio from 'minio'
import { loadEnv } from '../config/env'
import { createDb } from './client'
import * as schema from './schema'
import { demoSeed } from './seed-data'

const env = loadEnv()

const minioClient = new Minio.Client({
  endPoint: env.MINIO_ENDPOINT,
  port: env.MINIO_PORT,
  useSSL: env.MINIO_USE_SSL,
  accessKey: env.MINIO_ACCESS_KEY,
  secretKey: env.MINIO_SECRET_KEY
})

const demoPng = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=',
  'base64'
)

async function ensureBucket() {
  const exists = await minioClient.bucketExists(env.MINIO_BUCKET)
  if (!exists) {
    await minioClient.makeBucket(env.MINIO_BUCKET)
  }
}

async function seedMediaObjects(db: ReturnType<typeof createDb>['db']) {
  for (const item of demoSeed.media) {
    const existing = await db
      .select({ id: schema.mediaAssets.id })
      .from(schema.mediaAssets)
      .where(eq(schema.mediaAssets.objectKey, item.key))
      .limit(1)

    if (existing.length > 0) continue

    await minioClient.putObject(env.MINIO_BUCKET, item.key, demoPng, demoPng.length, {
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

async function seed() {
  const { client, db } = createDb()

  // Ensure MinIO bucket exists and seed media
  await ensureBucket()
  await seedMediaObjects(db)

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
  await seedMediaObjects(db)
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
