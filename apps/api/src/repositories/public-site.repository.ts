import { eq } from 'drizzle-orm'
import { createDb } from '../db/client'
import { mediaAssets, serviceCategories, services, shopSettings, staff } from '../db/schema'

export interface PublicSitePayload {
  shop: {
    name: string
    tagline: string
    description: string
    phone: string
    email: string | null
    address: string
    mapUrl: string | null
    openingHours: Record<string, string>
    seoTitle: string
    seoDescription: string
  }
  services: Array<{
    id: string
    categoryId: string
    categoryName: string
    name: string
    description: string
    durationMinutes: number
    priceCents: number
    imageUrl: string | null
  }>
  staff: Array<{
    id: string
    name: string
    title: string
    bio: string
    imageUrl: string | null
  }>
  gallery: Array<{
    id: string
    url: string
    altText: string
  }>
}

export function createPublicSiteRepository(databaseUrl?: string) {
  const { db } = createDb(databaseUrl)

  return {
    async getPublicSite(): Promise<PublicSitePayload> {
      const shopRow = await db.select().from(shopSettings).limit(1).then((rows) => rows[0])

      const activeCategories = await db
        .select()
        .from(serviceCategories)
        .where(eq(serviceCategories.active, true))
        .orderBy(serviceCategories.sortOrder)

      const activeServices = await db
        .select()
        .from(services)
        .where(eq(services.active, true))
        .orderBy(services.sortOrder)

      const activeStaff = await db
        .select()
        .from(staff)
        .where(eq(staff.active, true))

      const galleryRows = await db
        .select()
        .from(mediaAssets)
        .where(eq(mediaAssets.usageType, 'gallery'))

      const categoryMap = new Map(activeCategories.map((c) => [c.id, c.name]))

      return {
        shop: {
          name: shopRow.name,
          tagline: shopRow.tagline,
          description: shopRow.description,
          phone: shopRow.phone,
          email: shopRow.email,
          address: shopRow.address,
          mapUrl: shopRow.mapUrl,
          openingHours: shopRow.openingHours as Record<string, string>,
          seoTitle: shopRow.seoTitle,
          seoDescription: shopRow.seoDescription
        },
        services: activeServices.map((s) => ({
          id: s.id,
          categoryId: s.categoryId,
          categoryName: categoryMap.get(s.categoryId) ?? '',
          name: s.name,
          description: s.description,
          durationMinutes: s.durationMinutes,
          priceCents: s.priceCents,
          imageUrl: null
        })),
        staff: activeStaff.map((s) => ({
          id: s.id,
          name: s.name,
          title: s.title,
          bio: s.bio,
          imageUrl: null
        })),
        gallery: galleryRows.map((m) => ({
          id: m.id,
          url: m.publicUrl,
          altText: m.altText
        }))
      }
    }
  }
}
