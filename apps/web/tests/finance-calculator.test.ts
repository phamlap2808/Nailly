import { describe, expect, it } from 'vitest'
import { calculateDraftInvoiceTotals } from '../utils/finance-calculator'

describe('calculateDraftInvoiceTotals', () => {
  it('matches fixed tax and tip calculations for POS drafts', () => {
    expect(
      calculateDraftInvoiceTotals({
        items: [
          { quantity: 1, unitPriceCents: 5800 },
          { quantity: 1, unitPriceCents: 1800 }
        ],
        discountCents: 500,
        taxRateBps: 825,
        tipCents: 1000
      })
    ).toEqual({
      subtotalCents: 7600,
      discountCents: 500,
      taxCents: 586,
      tipCents: 1000,
      totalCents: 8686
    })
  })
})
