import { describe, expect, it } from 'vitest'
import { adminNavItems } from '../utils/admin-nav'

describe('adminNavItems', () => {
  it('shows staff users only booking access', () => {
    expect(adminNavItems('staff').map((item) => item.label)).toEqual(['Bookings'])
  })

  it('shows owners all admin areas', () => {
    expect(adminNavItems('owner').map((item) => item.label)).toEqual([
      'Overview',
      'Bookings',
      'Services',
      'Staff',
      'Media',
      'Settings'
    ])
  })
})
