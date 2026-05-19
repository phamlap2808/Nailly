import { describe, expect, it } from 'vitest'
import { adminNavItems } from '../utils/admin-nav'
import { defaultRolePermissions } from '@nailly/shared/src/permissions'

describe('adminNavItems', () => {
  it('shows staff users only checkout workflow areas', () => {
    expect(adminNavItems(defaultRolePermissions.staff).map((item) => item.label)).toEqual([
      'Bookings',
      'POS',
      'Invoices'
    ])
  })

  it('shows owners all admin areas', () => {
    expect(adminNavItems(defaultRolePermissions.owner).map((item) => item.label)).toEqual([
      'Overview',
      'Bookings',
      'POS',
      'Invoices',
      'Reports',
      'Promotions',
      'Banners',
      'Services',
      'Staff',
      'Media',
      'Settings',
      'Permissions'
    ])
  })
})
