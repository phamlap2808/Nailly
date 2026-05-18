export function getInvoiceStatusLabel(status: string) {
  const labels: Record<string, string> = {
    draft: 'Draft',
    open: 'Open',
    paid: 'Paid',
    partially_refunded: 'Partially refunded',
    refunded: 'Refunded',
    void: 'Void'
  }
  return labels[status] ?? status
}

export function getPaymentMethodLabel(method: string) {
  const labels: Record<string, string> = {
    cash: 'Cash',
    credit_card: 'Credit card',
    debit_card: 'Debit card',
    zelle: 'Zelle',
    venmo: 'Venmo',
    gift_card: 'Gift card',
    other: 'Other'
  }
  return labels[method] ?? method
}

export function formatPercentBps(value: number) {
  return `${(value / 100).toFixed(2)}%`
}
