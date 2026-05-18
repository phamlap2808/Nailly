import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => {
  const invoiceRow = { id: 'invoice-1', invoiceNumber: 'INV-000001' }
  const itemRows = [{ id: 'item-1', invoiceId: 'invoice-1', name: 'Gel Manicure' }]
  const paymentRows = [{ id: 'payment-1', invoiceId: 'invoice-1', amountCents: 7279 }]
  const refundRows = [{ id: 'refund-1', invoiceId: 'invoice-1', amountCents: 1000 }]

  const from = vi.fn(() => {
    const callIndex = from.mock.calls.length

    if (callIndex === 1) {
      return {
        where: vi.fn(() => ({
          limit: vi.fn().mockResolvedValue([invoiceRow])
        }))
      }
    }

    if (callIndex === 2) {
      return {
        where: vi.fn(() => ({
          orderBy: vi.fn().mockResolvedValue(itemRows)
        }))
      }
    }

    if (callIndex === 3) {
      return {
        where: vi.fn().mockResolvedValue(paymentRows)
      }
    }

    return {
      where: vi.fn().mockResolvedValue(refundRows)
    }
  })
  const select = vi.fn(() => ({ from }))

  return {
    db: { select },
    from,
    select
  }
})

vi.mock('../db/client', () => ({
  createDb: vi.fn(() => ({ db: mocks.db }))
}))

import { createFinanceRepository } from './finance.repository'

describe('createFinanceRepository', () => {
  beforeEach(() => {
    mocks.select.mockClear()
    mocks.from.mockClear()
  })

  it('loads invoice details with items, payments, and refunds', async () => {
    const repository = createFinanceRepository()

    const invoice = await repository.getInvoiceWithItems('invoice-1')

    expect(invoice).toMatchObject({
      id: 'invoice-1',
      items: [{ id: 'item-1' }],
      payments: [{ id: 'payment-1' }],
      refunds: [{ id: 'refund-1' }]
    })
  })
})
