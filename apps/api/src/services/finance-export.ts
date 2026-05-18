function csvEscape(value: unknown) {
  const text = String(value ?? '')
  return `"${text.replace(/"/g, '""')}"`
}

export function invoicesToCsv(rows: Array<Record<string, unknown>>) {
  const headers = ['invoiceNumber', 'customerName', 'source', 'status', 'totalCents', 'paidCents', 'refundedCents']
  return [headers.join(','), ...rows.map((row) => headers.map((header) => csvEscape(row[header])).join(','))].join('\n')
}

export function paymentsToCsv(rows: Array<Record<string, unknown>>) {
  const headers = ['invoiceId', 'method', 'amountCents', 'reference', 'paidAt']
  return [headers.join(','), ...rows.map((row) => headers.map((header) => csvEscape(row[header])).join(','))].join('\n')
}

export function refundsToCsv(rows: Array<Record<string, unknown>>) {
  const headers = ['invoiceId', 'paymentId', 'method', 'amountCents', 'reason', 'refundedAt']
  return [headers.join(','), ...rows.map((row) => headers.map((header) => csvEscape(row[header])).join(','))].join('\n')
}

export function payrollToCsv(rows: Array<Record<string, unknown>>) {
  const headers = ['staffName', 'salesCents', 'commissionCents', 'lineCount']
  return [headers.join(','), ...rows.map((row) => headers.map((header) => csvEscape(row[header])).join(','))].join('\n')
}
