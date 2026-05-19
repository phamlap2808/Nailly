import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const readSource = (path: string) => readFileSync(new URL(path, import.meta.url), 'utf8')

describe('admin permissions page', () => {
  it('renders an owner-only permission matrix with locked owner permissions', () => {
    const source = readSource('../pages/admin/permissions.vue')

    expect(source).toContain('/admin/permissions')
    expect(source).toContain('permission-matrix')
    expect(source).toContain('Owner permissions are always enabled')
    expect(source).toContain('saveRolePermissions')
    expect(source).toContain('permissions.manage')
  })
})
