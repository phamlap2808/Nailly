import { describe, expect, it } from 'vitest'
import { calculateInvoiceTotals } from './finance-math'

describe('calculateInvoiceTotals', () => {
  it('calculates subtotal, discount, fixed tax, tip, and total with integer cents', () => {
    expect(
      calculateInvoiceTotals({
        items: [
          { quantity: 1, unitPriceCents: 5800, commissionRateBps: 4500 },
          { quantity: 2, unitPriceCents: 1800, commissionRateBps: 4000 }
        ],
        discountCents: 500,
        taxRateBps: 825,
        tipCents: 1000,
        paidCents: 0,
        refundedCents: 0
      })
    ).toEqual({
      subtotalCents: 9400,
      discountCents: 500,
      taxableSubtotalCents: 8900,
      taxCents: 734,
      tipCents: 1000,
      totalCents: 10634,
      paidCents: 0,
      refundedCents: 0,
      netCollectedCents: 0,
      itemCommissions: [2610, 1440]
    })
  })

  it('caps discounts at subtotal and subtracts refunds from net collected', () => {
    expect(
      calculateInvoiceTotals({
        items: [{ quantity: 1, unitPriceCents: 5000, commissionRateBps: 5000 }],
        discountCents: 8000,
        taxRateBps: 825,
        tipCents: 0,
        paidCents: 5000,
        refundedCents: 2000
      })
    ).toMatchObject({
      subtotalCents: 5000,
      discountCents: 5000,
      taxCents: 0,
      totalCents: 0,
      paidCents: 5000,
      refundedCents: 2000,
      netCollectedCents: 3000
    })
  })
})
