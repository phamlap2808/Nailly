import { describe, expect, it } from 'vitest'
import { demoSeed } from './seed-data'
import {
  banners,
  bookings,
  invoices,
  invoiceItems,
  payments,
  promotions,
  refunds,
  rolePermissions,
  staff,
  shopSettings
} from './schema'

describe('demo seed data', () => {
  it('defines finance persistence columns for invoices, payments, refunds, settings, and staff commission', () => {
    expect(invoices).toBeDefined()
    expect(invoiceItems).toBeDefined()
    expect(payments).toBeDefined()
    expect(refunds).toBeDefined()
    expect(promotions).toBeDefined()
    expect(promotions.code).toBeDefined()
    expect(promotions.discountType).toBeDefined()
    expect(banners).toBeDefined()
    expect(banners.title).toBeDefined()
    expect(banners.imageId).toBeDefined()
    expect(rolePermissions.permission).toBeDefined()
    expect(rolePermissions.enabled).toBeDefined()
    expect(bookings.promotionCode).toBeDefined()
    expect(shopSettings.taxRateBps).toBeDefined()
    expect(shopSettings.invoicePrefix).toBeDefined()
    expect(shopSettings.receiptFooter).toBeDefined()
    expect(staff.commissionRateBps).toBeDefined()
  })

  it('creates one shop with English public content', () => {
    expect(demoSeed.shop.name).toBe('Luma Nail Studio')
    expect(demoSeed.shop.locale).toBe('en')
    expect(demoSeed.shop.address).toContain('Main Street')
  })

  it('includes nail services, staff, gallery, and role-based admins', () => {
    expect(demoSeed.categories.length).toBeGreaterThanOrEqual(5)
    expect(demoSeed.services.length).toBeGreaterThanOrEqual(16)
    expect(demoSeed.staff.length).toBeGreaterThanOrEqual(5)
    expect(demoSeed.media.length).toBeGreaterThanOrEqual(8)
    expect(demoSeed.adminUsers.map((user) => user.role).sort()).toEqual(['manager', 'owner', 'staff'])
    expect(demoSeed.promotions.length).toBeGreaterThanOrEqual(2)
    expect(demoSeed.promotions.map((promo) => promo.code)).toContain('WELCOME10')
    expect(demoSeed.banners.length).toBeGreaterThanOrEqual(1)
    expect(demoSeed.banners[0].imageKey).toContain('banner')
  })

  it('includes realistic confirmed bookings for booking UI slot checks', () => {
    const serviceNames = new Set(demoSeed.services.map((service) => service.name))
    const staffNames = new Set(demoSeed.staff.map((staff) => staff.name))

    expect(demoSeed.bookings.length).toBeGreaterThanOrEqual(4)
    expect(demoSeed.bookings.some((booking) => booking.status === 'confirmed')).toBe(true)

    for (const booking of demoSeed.bookings) {
      expect(staffNames.has(booking.staffName)).toBe(true)
      expect(booking.serviceNames.length).toBeGreaterThan(0)
      for (const serviceName of booking.serviceNames) {
        expect(serviceNames.has(serviceName)).toBe(true)
      }
    }
  })

  it('includes realistic finance demo data for POS and reporting', () => {
    expect(demoSeed.shop.taxRateBps).toBe(825)
    expect(demoSeed.shop.invoicePrefix).toBe('INV')
    expect(demoSeed.staff.every((person) => typeof person.commissionRateBps === 'number')).toBe(true)
    expect(demoSeed.financeInvoices.length).toBeGreaterThanOrEqual(4)
    expect(demoSeed.financeInvoices.some((invoice) => invoice.source === 'walk_in')).toBe(true)
    expect(demoSeed.financeInvoices.some((invoice) => invoice.refunds.length > 0)).toBe(true)
  })

  it('includes demo bookings for booking-sourced finance invoices', () => {
    const bookingCustomerNames = new Set(demoSeed.bookings.map((booking) => booking.customerName))
    const invoiceBookingCustomerNames = demoSeed.financeInvoices
      .filter((invoice) => invoice.source === 'booking')
      .map((invoice) => invoice.bookingCustomerName)

    expect(invoiceBookingCustomerNames.every((name) => name && bookingCustomerNames.has(name))).toBe(true)
  })
})
