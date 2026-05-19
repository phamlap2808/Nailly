import { hasPermission, type AdminPermission } from '@nailly/shared/src/permissions'

const items = [
  { label: 'Overview', to: '/admin', permission: 'reports.view' },
  { label: 'Bookings', to: '/admin/bookings', permission: 'bookings.view' },
  { label: 'POS', to: '/admin/pos', permission: 'pos.use' },
  { label: 'Invoices', to: '/admin/invoices', permission: 'invoices.view' },
  { label: 'Reports', to: '/admin/reports', permission: 'reports.view' },
  { label: 'Promotions', to: '/admin/promotions', permission: 'promotions.manage' },
  { label: 'Banners', to: '/admin/banners', permission: 'banners.manage' },
  { label: 'Services', to: '/admin/services', permission: 'catalog.manage' },
  { label: 'Staff', to: '/admin/staff', permission: 'staff.manage' },
  { label: 'Media', to: '/admin/media', permission: 'media.manage' },
  { label: 'Settings', to: '/admin/settings', permission: 'settings.manage' },
  { label: 'Permissions', to: '/admin/permissions', permission: 'permissions.manage' }
] as const

export function adminNavItems(permissions: readonly AdminPermission[] | null | undefined) {
  return items.filter((item) => hasPermission(permissions, item.permission))
}
