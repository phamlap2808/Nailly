export interface DraftInvoiceItem {
  quantity: number
  unitPriceCents: number
}

function nonNegativeInteger(value: number) {
  if (!Number.isFinite(value)) {
    return 0
  }

  return Math.max(0, Math.trunc(value))
}

export function calculateDraftInvoiceTotals(input: {
  items: DraftInvoiceItem[]
  discountCents: number
  taxRateBps: number
  tipCents: number
}) {
  const subtotalCents = input.items.reduce(
    (sum, item) => sum + nonNegativeInteger(item.quantity) * nonNegativeInteger(item.unitPriceCents),
    0
  )
  const discountCents = Math.min(nonNegativeInteger(input.discountCents), subtotalCents)
  const taxableSubtotalCents = subtotalCents - discountCents
  const taxCents = Math.round((taxableSubtotalCents * nonNegativeInteger(input.taxRateBps)) / 10000)
  const tipCents = nonNegativeInteger(input.tipCents)

  return {
    subtotalCents,
    discountCents,
    taxCents,
    tipCents,
    totalCents: taxableSubtotalCents + taxCents + tipCents
  }
}
