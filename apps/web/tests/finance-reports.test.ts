import { describe, expect, it } from 'vitest'
import { summarizeRevenue } from '../utils/finance-reports'

describe('summarizeRevenue', () => {
  it('summarizes gross, refunds, net, tax, tips, and invoice count', () => {
    expect(
      summarizeRevenue([
        { totalCents: 10000, refundedCents: 1000, taxCents: 800, tipCents: 1200 },
        { totalCents: 5000, refundedCents: 0, taxCents: 400, tipCents: 500 }
      ])
    ).toEqual({
      grossCents: 15000,
      refundedCents: 1000,
      netCents: 14000,
      taxCents: 1200,
      tipCents: 1700,
      invoiceCount: 2
    })
  })
})
