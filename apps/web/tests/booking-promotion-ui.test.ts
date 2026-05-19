import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const bookingForm = readFileSync(new URL('../components/BookingForm.vue', import.meta.url), 'utf8')

describe('booking promotion UI', () => {
  it('lets customers validate a promotion code before submitting a booking request', () => {
    expect(bookingForm).toContain('promotionCode')
    expect(bookingForm).toContain('applyPromotionCode')
    expect(bookingForm).toContain('/public/promotions/validate')
    expect(bookingForm).toContain('Apply code')
    expect(bookingForm).toContain('promotionDiscountCents')
    expect(bookingForm).toContain('Estimated total')
  })
})
