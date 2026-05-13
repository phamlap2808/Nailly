import type { AdminRole } from '@nailly/shared'

const rank: Record<AdminRole, number> = {
  staff: 1,
  manager: 2,
  owner: 3
}

export function canAccessRole(actual: AdminRole, allowed: AdminRole[]): boolean {
  return allowed.some((role) => rank[actual] >= rank[role])
}
