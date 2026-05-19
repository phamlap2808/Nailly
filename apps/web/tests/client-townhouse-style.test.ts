import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const readSource = (path: string) => readFileSync(new URL(path, import.meta.url), 'utf8')

describe('Townhouse-inspired client surface', () => {
  it('uses an editorial public nav with announcement, centered wordmark, and quick actions', () => {
    const source = readSource('../components/PublicNav.vue')

    expect(source).toContain('client-announcement')
    expect(source).toContain('client-wordmark')
    expect(source).toContain('shopName')
    expect(source).toContain('resolvedShopName')
    expect(source).toContain('client-quick-actions')
    expect(source).not.toContain('menu-toggle')
    expect(source).not.toContain('menuOpen')
    expect(source).not.toContain('/admin')
  })

  it('renders the landing page as an image-led editorial client experience', () => {
    const source = readSource('../pages/index.vue')

    expect(source).toContain("key: 'public-site'")
    expect(source).toContain(':shop-name="site?.shop?.name"')
    expect(source).toContain('campaign-hero')
    expect(source).toContain('hero-background')
    expect(source).toContain('client-tile-grid')
    expect(source).toContain('tile-services')
    expect(source).toContain('tile-gallery')
    expect(source).toContain('tile-booking')
    expect(source).not.toContain('hero-visual')
  })

  it('keeps booking flow editorial but operationally compact', () => {
    const bookingPage = readSource('../pages/booking.vue')
    const bookingForm = readSource('../components/BookingForm.vue')

    expect(bookingPage).toContain("key: 'public-site'")
    expect(bookingPage).toContain(':shop-name="site?.shop?.name"')
    expect(bookingPage).toContain('booking-campaign')
    expect(bookingPage).toContain('booking-client-shell')
    expect(bookingForm).toContain('client-booking-form')
    expect(bookingForm).toContain('booking-treatment-picker')
  })
})
