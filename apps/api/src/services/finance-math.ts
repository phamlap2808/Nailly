export interface FinanceMathItem {
  quantity: number
  unitPriceCents: number
  commissionRateBps: number
}

export interface FinanceMathInput {
  items: FinanceMathItem[]
  discountCents: number
  taxRateBps: number
  tipCents: number
  paidCents: number
  refundedCents: number
}

export interface FinanceMathResult {
  subtotalCents: number
  discountCents: number
  taxableSubtotalCents: number
  taxCents: number
  tipCents: number
  totalCents: number
  paidCents: number
  refundedCents: number
  netCollectedCents: number
  itemCommissions: number[]
}

function nonNegativeInteger(value: number) {
  if (!Number.isFinite(value)) {
    return 0
  }

  return Math.max(0, Math.trunc(value))
}

export function calculateInvoiceTotals(input: FinanceMathInput): FinanceMathResult {
  const subtotalCents = input.items.reduce(
    (sum, item) => sum + nonNegativeInteger(item.quantity) * nonNegativeInteger(item.unitPriceCents),
    0
  )
  const discountCents = Math.min(nonNegativeInteger(input.discountCents), subtotalCents)
  const taxableSubtotalCents = subtotalCents - discountCents
  const taxCents = Math.round((taxableSubtotalCents * nonNegativeInteger(input.taxRateBps)) / 10000)
  const tipCents = nonNegativeInteger(input.tipCents)
  const totalCents = taxableSubtotalCents + taxCents + tipCents
  const paidCents = nonNegativeInteger(input.paidCents)
  const refundedCents = nonNegativeInteger(input.refundedCents)

  return {
    subtotalCents,
    discountCents,
    taxableSubtotalCents,
    taxCents,
    tipCents,
    totalCents,
    paidCents,
    refundedCents,
    netCollectedCents: paidCents - refundedCents,
    itemCommissions: input.items.map((item) =>
      Math.round(
        (nonNegativeInteger(item.quantity) *
          nonNegativeInteger(item.unitPriceCents) *
          nonNegativeInteger(item.commissionRateBps)) /
          10000
      )
    )
  }
}
