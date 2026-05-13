import { describe, expect, it } from 'vitest'
import { demoSeed } from './seed-data'

describe('demo seed data', () => {
  it('creates one shop with English public content', () => {
    expect(demoSeed.shop.name).toBe('Luma Nail Studio')
    expect(demoSeed.shop.locale).toBe('en')
    expect(demoSeed.shop.address).toContain('Main Street')
  })

  it('includes nail services, staff, gallery, and role-based admins', () => {
    expect(demoSeed.categories.length).toBeGreaterThanOrEqual(3)
    expect(demoSeed.services.length).toBeGreaterThanOrEqual(6)
    expect(demoSeed.staff.length).toBeGreaterThanOrEqual(3)
    expect(demoSeed.media.length).toBeGreaterThanOrEqual(4)
    expect(demoSeed.adminUsers.map((user) => user.role).sort()).toEqual(['manager', 'owner', 'staff'])
  })
})
