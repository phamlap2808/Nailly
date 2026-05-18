export type InvoiceStatusFilter = 'all' | string
export type InvoiceSourceFilter = 'all' | string

export interface InvoiceTableRow {
  id: string
  invoiceNumber: string
  customerName: string
  status: string
  source: string
}

export function filterInvoices<TInvoice extends InvoiceTableRow>(
  invoices: TInvoice[],
  filters: { searchQuery: string; status: InvoiceStatusFilter; source: InvoiceSourceFilter }
) {
  const query = filters.searchQuery.trim().toLowerCase()
  return invoices.filter((invoice) => {
    const matchesSearch =
      !query ||
      [invoice.invoiceNumber, invoice.customerName].some((value) =>
        value.toLowerCase().includes(query)
      )
    const matchesStatus = filters.status === 'all' || invoice.status === filters.status
    const matchesSource = filters.source === 'all' || invoice.source === filters.source
    return matchesSearch && matchesStatus && matchesSource
  })
}

export function paginateInvoices<TInvoice>(invoices: TInvoice[], currentPage: number, pageSize: number) {
  const safePageSize = Math.max(1, Math.trunc(pageSize) || 10)
  const totalItems = invoices.length
  const totalPages = Math.max(1, Math.ceil(totalItems / safePageSize))
  const safeCurrentPage = Math.min(Math.max(1, Math.trunc(currentPage) || 1), totalPages)
  const startIndex = (safeCurrentPage - 1) * safePageSize
  const endIndex = Math.min(startIndex + safePageSize, totalItems)
  return {
    items: invoices.slice(startIndex, endIndex),
    currentPage: safeCurrentPage,
    totalPages,
    totalItems,
    startItem: totalItems ? startIndex + 1 : 0,
    endItem: endIndex
  }
}
