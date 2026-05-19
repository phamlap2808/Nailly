import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const posPage = readFileSync(new URL('../pages/admin/pos.vue', import.meta.url), 'utf8')

describe('admin POS promotion flow', () => {
  it('validates promotion codes and includes them when saving invoices', () => {
    expect(posPage).toContain('promotionCode')
    expect(posPage).toContain('applyPromotionCode')
    expect(posPage).toContain('/public/promotions/validate')
    expect(posPage).toContain('Promotion code')
    expect(posPage).toContain('appliedPromotionCode')
    expect(posPage).toContain('promotionCode: appliedPromotionCode.value')
  })
})
