import { describe, expect, it } from 'vitest'
import { canAccessPermission, resolveRolePermissions } from './rbac'

describe('permission based RBAC', () => {
  it('allows owners to access every admin permission', () => {
    const permissions = resolveRolePermissions('owner', [])

    expect(canAccessPermission(permissions, 'permissions.manage')).toBe(true)
    expect(canAccessPermission(permissions, 'pos.use')).toBe(true)
  })

  it('uses persisted enabled permissions when role rows exist', () => {
    const permissions = resolveRolePermissions('manager', [
      { permission: 'reports.view', enabled: true },
      { permission: 'reports.export', enabled: false },
      { permission: 'settings.manage', enabled: true }
    ])

    expect(permissions).toEqual(['reports.view', 'settings.manage'])
    expect(canAccessPermission(permissions, 'reports.export')).toBe(false)
  })

  it('falls back to defaults when a role has not been seeded', () => {
    const permissions = resolveRolePermissions('staff', [])

    expect(canAccessPermission(permissions, 'pos.use')).toBe(true)
    expect(canAccessPermission(permissions, 'invoices.refund')).toBe(false)
  })
})
