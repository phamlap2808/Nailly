import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const posPage = readFileSync(new URL('../pages/admin/pos.vue', import.meta.url), 'utf8')

describe('admin POS compact ticket layout', () => {
  it('uses the approved compact ticket page structure', () => {
    expect(posPage).toContain('class="pos-workspace"')
    expect(posPage).toContain('class="checkout-column surface-panel"')
    expect(posPage).toContain('service-grid')
    expect(posPage).toContain('class="ticket-table"')
    expect(posPage).toContain('summary-action')
    expect(posPage).not.toContain('class="pos-layout"')
    expect(posPage).not.toContain('class="service-list"')
  })

  it('keeps editable money fields user-facing while preserving cents internally', () => {
    expect(posPage).toContain('formatMoneyInput')
    expect(posPage).toContain('parseMoneyToCents')
    expect(posPage).toContain('updateItemPrice')
    expect(posPage).toContain('updateDiscount')
    expect(posPage).toContain('updateTip')
    expect(posPage).not.toContain('Discount cents')
    expect(posPage).not.toContain('Tip cents')
    expect(posPage).not.toContain('Unit price cents')
  })

  it('keeps summary actions and item removal accessible', () => {
    expect(posPage).toContain('aria-label="Remove item"')
    expect(posPage).toContain('lucide:trash-2')
    expect(posPage).toContain('lucide:save')
    expect(posPage).toContain('Save invoice')
  })

  it('keeps the service picker compact with scrollable grid and list views', () => {
    expect(posPage).toContain('serviceViewMode')
    expect(posPage).toContain('class="service-view-toggle"')
    expect(posPage).toContain('class="service-scroll"')
    expect(posPage).toContain('class="service-grid service-grid-view"')
    expect(posPage).toContain('class="service-list-view"')
    expect(posPage).toContain('lucide:grid-2x2')
    expect(posPage).toContain('lucide:list')
    expect(posPage).toContain('max-height: clamp(')
    expect(posPage).toContain('overflow-y: auto;')
  })
})
