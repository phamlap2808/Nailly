import { describe, expect, it } from 'vitest'
import { demoSeed } from './seed-data'

describe('demo seed data', () => {
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
})
