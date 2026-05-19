import { describe, expect, it } from 'vitest'
import {
  calculatePromotionDiscount,
  normalizePromotionCode,
  validatePromotionForSubtotal,
  type PromotionForValidation
} from './promotion.service'

const activePromo: PromotionForValidation = {
  code: 'WELCOME10',
  name: 'Welcome 10%',
  discountType: 'percent',
  discountValue: 10,
  maxDiscountCents: 1500,
  minSubtotalCents: 5000,
  usageLimit: 2,
  usedCount: 1,
  startsAt: new Date('2026-01-01T00:00:00Z'),
  endsAt: new Date('2026-12-31T23:59:59Z'),
  active: true
}

describe('promotion service helpers', () => {
  it('normalizes promo codes for storage and lookup', () => {
    expect(normalizePromotionCode(' welcome-10 ')).toBe('WELCOME-10')
    expect(normalizePromotionCode('')).toBe('')
  })

  it('calculates percent and fixed discounts with caps', () => {
    expect(calculatePromotionDiscount(activePromo, 20000)).toBe(1500)
    expect(calculatePromotionDiscount({ ...activePromo, discountType: 'fixed', discountValue: 2500, maxDiscountCents: null }, 20000)).toBe(2500)
    expect(calculatePromotionDiscount({ ...activePromo, discountType: 'fixed', discountValue: 2500, maxDiscountCents: null }, 1200)).toBe(1200)
  })

  it('validates active dates, minimum subtotal, and usage limits', () => {
    expect(validatePromotionForSubtotal(activePromo, 10000, new Date('2026-06-01T00:00:00Z'))).toMatchObject({
      valid: true,
      discountCents: 1000
    })
    expect(validatePromotionForSubtotal(activePromo, 4000, new Date('2026-06-01T00:00:00Z'))).toMatchObject({
      valid: false,
      code: 'minimum_not_met'
    })
    expect(validatePromotionForSubtotal({ ...activePromo, usedCount: 2 }, 10000, new Date('2026-06-01T00:00:00Z'))).toMatchObject({
      valid: false,
      code: 'usage_limit_reached'
    })
    expect(validatePromotionForSubtotal(activePromo, 10000, new Date('2027-01-01T00:00:00Z'))).toMatchObject({
      valid: false,
      code: 'expired'
    })
  })
})
