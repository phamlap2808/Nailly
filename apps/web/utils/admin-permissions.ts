import { hasPermission, type AdminPermission } from '@nailly/shared/src/permissions'
import { adminNavItems } from './admin-nav'

const adminRoutePermissions = [
  { prefix: '/admin/permissions', permission: 'permissions.manage' },
  { prefix: '/admin/promotions', permission: 'promotions.manage' },
  { prefix: '/admin/banners', permission: 'banners.manage' },
  { prefix: '/admin/services', permission: 'catalog.manage' },
  { prefix: '/admin/staff', permission: 'staff.manage' },
  { prefix: '/admin/media', permission: 'media.manage' },
  { prefix: '/admin/settings', permission: 'settings.manage' },
  { prefix: '/admin/bookings', permission: 'bookings.view' },
  { prefix: '/admin/pos', permission: 'pos.use' },
  { prefix: '/admin/invoices', permission: 'invoices.view' },
  { prefix: '/admin/reports', permission: 'reports.view' },
  { prefix: '/admin', permission: 'reports.view' }
] as const satisfies Array<{ prefix: string; permission: AdminPermission }>

export function requiredPermissionForAdminPath(path: string): AdminPermission | null {
  if (path === '/admin/login' || path === '/admin/forbidden') return null

  const match = adminRoutePermissions.find((route) => path === route.prefix || path.startsWith(`${route.prefix}/`))
  return match?.permission ?? null
}

export function canAccessAdminPath(path: string, permissions: readonly AdminPermission[] | null | undefined) {
  const permission = requiredPermissionForAdminPath(path)
  return !permission || hasPermission(permissions, permission)
}

export function firstAccessibleAdminPath(permissions: readonly AdminPermission[] | null | undefined) {
  return adminNavItems(permissions)[0]?.to ?? '/admin/forbidden'
}
