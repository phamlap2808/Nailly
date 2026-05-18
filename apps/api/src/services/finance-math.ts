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

function cents(value: number) {
  return Math.max(0, Math.trunc(value))
}

export function calculateInvoiceTotals(input: FinanceMathInput): FinanceMathResult {
  const subtotalCents = input.items.reduce(
    (sum, item) => sum + cents(item.quantity) * cents(item.unitPriceCents),
    0
  )
  const discountCents = Math.min(cents(input.discountCents), subtotalCents)
  const taxableSubtotalCents = subtotalCents - discountCents
  const taxCents = Math.round((taxableSubtotalCents * cents(input.taxRateBps)) / 10000)
  const tipCents = cents(input.tipCents)
  const totalCents = taxableSubtotalCents + taxCents + tipCents
  const paidCents = cents(input.paidCents)
  const refundedCents = cents(input.refundedCents)

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
      Math.round((cents(item.quantity) * cents(item.unitPriceCents) * cents(item.commissionRateBps)) / 10000)
    )
  }
}
