import { describe, expect, it } from 'vitest'
import { invoicesToCsv } from './finance-export'

describe('invoicesToCsv', () => {
  it('exports invoice rows with CSV escaping for spreadsheet tools', () => {
    expect(
      invoicesToCsv([
        {
          invoiceNumber: 'INV-000001',
          customerName: 'Mia "Gel", Nguyen',
          source: 'walk_in',
          status: 'paid',
          totalCents: 7600,
          paidCents: 7600,
          refundedCents: 0
        }
      ])
    ).toBe(
      'invoiceNumber,customerName,source,status,totalCents,paidCents,refundedCents\n' +
        '"INV-000001","Mia ""Gel"", Nguyen","walk_in","paid","7600","7600","0"'
    )
  })
})
