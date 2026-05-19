import { describe, expect, it } from 'vitest'
import { defaultRolePermissions } from '@nailly/shared/src/permissions'
import { canAccessAdminPath, firstAccessibleAdminPath, requiredPermissionForAdminPath } from '../utils/admin-permissions'

describe('admin permission routing helpers', () => {
  it('maps admin routes to specific permissions', () => {
    expect(requiredPermissionForAdminPath('/admin/bookings')).toBe('bookings.view')
    expect(requiredPermissionForAdminPath('/admin/services')).toBe('catalog.manage')
    expect(requiredPermissionForAdminPath('/admin/permissions')).toBe('permissions.manage')
  })

  it('keeps staff out of manager-only pages but leaves checkout workflow open', () => {
    expect(canAccessAdminPath('/admin/pos', defaultRolePermissions.staff)).toBe(true)
    expect(canAccessAdminPath('/admin/reports', defaultRolePermissions.staff)).toBe(false)
    expect(canAccessAdminPath('/admin/settings', defaultRolePermissions.staff)).toBe(false)
  })

  it('finds a safe landing page when overview is not allowed', () => {
    expect(firstAccessibleAdminPath(defaultRolePermissions.staff)).toBe('/admin/bookings')
    expect(firstAccessibleAdminPath(defaultRolePermissions.owner)).toBe('/admin')
  })
})
