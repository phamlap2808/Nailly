import { describe, expect, it } from 'vitest'
import { filterInvoices, paginateInvoices } from '../utils/invoice-table'

const invoices = [
  { id: '1', invoiceNumber: 'INV-001', customerName: 'Olivia Carter', status: 'paid', source: 'booking' },
  { id: '2', invoiceNumber: 'INV-002', customerName: 'Avery Stone', status: 'open', source: 'walk_in' },
  { id: '3', invoiceNumber: 'INV-003', customerName: 'Mia Thompson', status: 'refunded', source: 'walk_in' }
]

describe('invoice table helpers', () => {
  it('filters invoices by search, status, and source', () => {
    expect(filterInvoices(invoices, { searchQuery: 'olivia', status: 'all', source: 'all' }).map((row) => row.id)).toEqual(['1'])
    expect(filterInvoices(invoices, { searchQuery: '', status: 'refunded', source: 'walk_in' }).map((row) => row.id)).toEqual(['3'])
  })

  it('paginates invoices', () => {
    expect(paginateInvoices(invoices, 1, 2).items.map((row) => row.id)).toEqual(['1', '2'])
    expect(paginateInvoices(invoices, 2, 2).items.map((row) => row.id)).toEqual(['3'])
  })
})
