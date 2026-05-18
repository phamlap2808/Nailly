export interface RevenueSummaryInvoice {
  totalCents: number
  refundedCents: number
  taxCents: number
  tipCents: number
}

export function summarizeRevenue(invoices: RevenueSummaryInvoice[]) {
  return invoices.reduce(
    (summary, invoice) => ({
      grossCents: summary.grossCents + invoice.totalCents,
      refundedCents: summary.refundedCents + invoice.refundedCents,
      netCents: summary.netCents + invoice.totalCents - invoice.refundedCents,
      taxCents: summary.taxCents + invoice.taxCents,
      tipCents: summary.tipCents + invoice.tipCents,
      invoiceCount: summary.invoiceCount + 1
    }),
    {
      grossCents: 0,
      refundedCents: 0,
      netCents: 0,
      taxCents: 0,
      tipCents: 0,
      invoiceCount: 0
    }
  )
}
