import {
  adminPermissionValues,
  defaultRolePermissions,
  type AdminPermission,
  type AdminRole
} from '@nailly/shared'

interface PermissionRow {
  permission: string
  enabled: boolean
}

export function resolveRolePermissions(
  role: AdminRole,
  rows: PermissionRow[] | null | undefined
): AdminPermission[] {
  if (role === 'owner') return [...adminPermissionValues]
  if (!rows?.length) return [...defaultRolePermissions[role]]

  return rows
    .filter((row): row is PermissionRow & { permission: AdminPermission } =>
      row.enabled && adminPermissionValues.includes(row.permission as AdminPermission)
    )
    .map((row) => row.permission)
}

export function canAccessPermission(
  permissions: readonly AdminPermission[] | null | undefined,
  permission: AdminPermission
): boolean {
  return Boolean(permissions?.includes(permission))
}
