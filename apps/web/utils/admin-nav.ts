import type { AdminRole } from '@nailly/shared'

const items = [
  { label: 'Overview', to: '/admin', minRole: 'manager' },
  { label: 'Bookings', to: '/admin/bookings', minRole: 'staff' },
  { label: 'POS', to: '/admin/pos', minRole: 'staff' },
  { label: 'Invoices', to: '/admin/invoices', minRole: 'staff' },
  { label: 'Reports', to: '/admin/reports', minRole: 'manager' },
  { label: 'Services', to: '/admin/services', minRole: 'manager' },
  { label: 'Staff', to: '/admin/staff', minRole: 'manager' },
  { label: 'Media', to: '/admin/media', minRole: 'manager' },
  { label: 'Settings', to: '/admin/settings', minRole: 'manager' }
] as const

const rank: Record<AdminRole, number> = { staff: 1, manager: 2, owner: 3 }

export function adminNavItems(role: AdminRole) {
  return items.filter((item) => rank[role] >= rank[item.minRole])
}
