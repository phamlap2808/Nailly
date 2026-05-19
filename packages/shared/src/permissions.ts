export const adminRoleValues = ['owner', 'manager', 'staff'] as const
export type AdminRole = (typeof adminRoleValues)[number]

export const adminPermissionValues = [
  'bookings.view',
  'bookings.update',
  'bookings.checkout',
  'pos.use',
  'invoices.view',
  'invoices.create',
  'invoices.pay',
  'invoices.refund',
  'invoices.void',
  'reports.view',
  'reports.export',
  'catalog.view',
  'catalog.manage',
  'staff.view',
  'staff.manage',
  'media.view',
  'media.manage',
  'banners.view',
  'banners.manage',
  'promotions.view',
  'promotions.manage',
  'settings.view',
  'settings.manage',
  'users.view',
  'users.manage',
  'permissions.manage'
] as const
export type AdminPermission = (typeof adminPermissionValues)[number]

export const defaultRolePermissions = {
  owner: adminPermissionValues,
  manager: [
    'bookings.view',
    'bookings.update',
    'bookings.checkout',
    'pos.use',
    'invoices.view',
    'invoices.create',
    'invoices.pay',
    'invoices.refund',
    'invoices.void',
    'reports.view',
    'reports.export',
    'catalog.view',
    'catalog.manage',
    'staff.view',
    'staff.manage',
    'media.view',
    'media.manage',
    'banners.view',
    'banners.manage',
    'promotions.view',
    'promotions.manage',
    'settings.view',
    'settings.manage'
  ],
  staff: [
    'bookings.view',
    'bookings.update',
    'bookings.checkout',
    'pos.use',
    'invoices.view',
    'invoices.create',
    'invoices.pay',
    'catalog.view',
    'staff.view',
    'settings.view'
  ]
} as const satisfies Record<AdminRole, readonly AdminPermission[]>

export function permissionsForRole(role: AdminRole): AdminPermission[] {
  return [...defaultRolePermissions[role]]
}

export function hasPermission(
  permissions: readonly AdminPermission[] | null | undefined,
  permission: AdminPermission
): boolean {
  return Boolean(permissions?.includes(permission))
}
