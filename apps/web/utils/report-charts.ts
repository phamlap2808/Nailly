export interface RevenueTrendInvoice {
  totalCents: number
  refundedCents: number
  issuedAt: string | null
  createdAt: string
}

export interface RevenueTrendRow {
  key: string
  label: string
  grossCents: number
  netCents: number
  invoiceCount: number
}

export function buildRevenueTrendRows(invoices: RevenueTrendInvoice[]): RevenueTrendRow[] {
  const rows = new Map<string, RevenueTrendRow>()

  for (const invoice of invoices) {
    const rawDate = invoice.issuedAt ?? invoice.createdAt
    const date = new Date(rawDate)
    const key = date.toISOString().slice(0, 10)
    const current = rows.get(key) ?? {
      key,
      label: new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(date),
      grossCents: 0,
      netCents: 0,
      invoiceCount: 0
    }

    current.grossCents += invoice.totalCents
    current.netCents += invoice.totalCents - invoice.refundedCents
    current.invoiceCount += 1
    rows.set(key, current)
  }

  return Array.from(rows.values()).sort((a, b) => a.key.localeCompare(b.key))
}

export function takeTopRows<T, K extends keyof T>(rows: T[], amountKey: K, limit: number) {
  return [...rows].sort((a, b) => Number(b[amountKey]) - Number(a[amountKey])).slice(0, limit)
}

export function toPercent(value: number, max: number, minVisible = 0) {
  if (max <= 0 || value <= 0) return '0%'
  return `${Math.max(minVisible, Math.round((value / max) * 100))}%`
}
