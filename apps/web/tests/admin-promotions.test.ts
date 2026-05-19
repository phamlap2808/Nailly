import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { defaultRolePermissions } from '@nailly/shared/src/permissions'
import { adminNavItems } from '../utils/admin-nav'

const promotionsPage = readFileSync(new URL('../pages/admin/promotions.vue', import.meta.url), 'utf8')

describe('admin promotions management', () => {
  it('adds promotions to manager navigation', () => {
    expect(adminNavItems(defaultRolePermissions.manager).map((item) => item.label)).toContain('Promotions')
    expect(adminNavItems(defaultRolePermissions.staff).map((item) => item.label)).not.toContain('Promotions')
  })

  it('renders a table and editor backed by the promotions API', () => {
    expect(promotionsPage).toContain('/admin/promotions')
    expect(promotionsPage).toContain('Promotion code')
    expect(promotionsPage).toContain('discountType')
    expect(promotionsPage).toContain('usageLimit')
    expect(promotionsPage).toContain('promotion-table')
  })

  it('uses a compact grouped editor that avoids overflowing date inputs', () => {
    expect(promotionsPage).toContain('editor-shell')
    expect(promotionsPage).toContain('editor-status-row')
    expect(promotionsPage).toContain('offer-grid')
    expect(promotionsPage).toContain('rules-grid')
    expect(promotionsPage).toContain('date-range-grid')
    expect(promotionsPage).toContain('discount-input-shell')
    expect(promotionsPage).toContain('class="editor-actions"')
    expect(promotionsPage).toContain('minmax(0, 1fr)')
    expect(promotionsPage).toContain('overflow: hidden')
  })

  it('renders discount units as attached input addons instead of loose inline symbols', () => {
    expect(promotionsPage).toContain('discount-addon')
    expect(promotionsPage).toContain('discount-addon--prefix')
    expect(promotionsPage).toContain('discount-addon--suffix')
    expect(promotionsPage).toContain('grid-template-columns: auto minmax(0, 1fr);')
    expect(promotionsPage).toContain('grid-template-columns: minmax(0, 1fr) auto;')
    expect(promotionsPage).toContain('border-left')
    expect(promotionsPage).toContain('border-right')
  })
})
