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

  it('truncates fractional values, clamps negatives, and rounds item commissions', () => {
    expect(
      calculateInvoiceTotals({
        items: [
          { quantity: 2.9, unitPriceCents: 1000.9, commissionRateBps: 3333.9 },
          { quantity: -1, unitPriceCents: 5000, commissionRateBps: 5000 }
        ],
        discountCents: -10.8,
        taxRateBps: 0,
        tipCents: 100.9,
        paidCents: 1234.9,
        refundedCents: -9
      })
    ).toEqual({
      subtotalCents: 2000,
      discountCents: 0,
      taxableSubtotalCents: 2000,
      taxCents: 0,
      tipCents: 100,
      totalCents: 2100,
      paidCents: 1234,
      refundedCents: 0,
      netCollectedCents: 1234,
      itemCommissions: [667, 0]
    })
  })

  it('coerces non-finite values to zero before calculating totals', () => {
    expect(
      calculateInvoiceTotals({
        items: [
          { quantity: Infinity, unitPriceCents: 1000, commissionRateBps: 5000 },
          { quantity: 1, unitPriceCents: NaN, commissionRateBps: 5000 },
          { quantity: 1, unitPriceCents: 1000, commissionRateBps: Infinity }
        ],
        discountCents: Infinity,
        taxRateBps: NaN,
        tipCents: -Infinity,
        paidCents: Infinity,
        refundedCents: NaN
      })
    ).toEqual({
      subtotalCents: 1000,
      discountCents: 0,
      taxableSubtotalCents: 1000,
      taxCents: 0,
      tipCents: 0,
      totalCents: 1000,
      paidCents: 0,
      refundedCents: 0,
      netCollectedCents: 0,
      itemCommissions: [0, 0, 0]
    })
  })
})
