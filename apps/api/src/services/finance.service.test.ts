import { describe, expect, it, vi } from 'vitest'
import { ApiError } from '../http/errors'
import { createFinanceService } from './finance.service'

function createRepository() {
  return {
    getFinanceSettings: vi.fn().mockResolvedValue({ taxRateBps: 825, invoicePrefix: 'INV' }),
    getServiceById: vi.fn().mockResolvedValue({ id: 'svc-1', name: 'Gel Manicure', priceCents: 5800 }),
    getStaffById: vi.fn().mockResolvedValue({ id: 'staff-1', commissionRateBps: 4500 }),
    createInvoice: vi.fn().mockResolvedValue({ id: 'invoice-1', invoiceNumber: 'INV-000001', status: 'open' }),
    getInvoiceWithItems: vi.fn(),
    addPayment: vi.fn(),
    addRefund: vi.fn(),
    voidInvoice: vi.fn()
  }
}

describe('createFinanceService', () => {
  it('creates walk-in invoices with tax and commission snapshots', async () => {
    const repository = createRepository()
    const service = createFinanceService(repository)

    await service.createInvoice({
      source: 'walk_in',
      customerName: 'Olivia Carter',
      customerPhone: '+1 555 0100',
      items: [
        {
          itemType: 'service',
          serviceId: 'svc-1',
          staffId: 'staff-1',
          name: 'Gel Manicure',
          quantity: 1,
          unitPriceCents: 5800
        }
      ],
      discountCents: 0,
      tipCents: 1000
    }, { adminUserId: 'admin-1' })

    expect(repository.createInvoice).toHaveBeenCalledWith(
      expect.objectContaining({
        totalCents: 7279,
        taxCents: 479,
        items: [
          expect.objectContaining({
            commissionRateBps: 4500,
            commissionCents: 2610
          })
        ]
      })
    )
  })

  it('rejects refunds larger than the refundable balance', async () => {
    const repository = createRepository()
    repository.getInvoiceWithItems.mockResolvedValue({
      id: 'invoice-1',
      status: 'paid',
      paidCents: 1000,
      refundedCents: 200,
      totalCents: 1000
    })
    const service = createFinanceService(repository)

    await expect(
      service.refundInvoice('invoice-1', {
        amountCents: 900,
        method: 'cash',
        reason: 'Too much'
      }, { adminUserId: 'admin-1' })
    ).rejects.toBeInstanceOf(ApiError)
  })

  it('uses not_found when refunding a missing invoice', async () => {
    const repository = createRepository()
    repository.getInvoiceWithItems.mockResolvedValue(null)
    const service = createFinanceService(repository)

    await expect(
      service.refundInvoice('invoice-missing', {
        amountCents: 100,
        method: 'cash',
        reason: 'Missing invoice'
      }, { adminUserId: 'admin-1' })
    ).rejects.toMatchObject({ code: 'not_found' })
  })

  it('uses not_found when voiding a missing invoice', async () => {
    const repository = createRepository()
    repository.getInvoiceWithItems.mockResolvedValue(null)
    const service = createFinanceService(repository)

    await expect(
      service.voidInvoice('invoice-missing', 'Created in error', { adminUserId: 'admin-1' })
    ).rejects.toMatchObject({ code: 'not_found' })
  })

  it('rejects voiding invoices with any paid balance', async () => {
    const repository = createRepository()
    repository.getInvoiceWithItems.mockResolvedValue({
      id: 'invoice-1',
      status: 'open',
      paidCents: 500,
      refundedCents: 0,
      totalCents: 1000
    })
    const service = createFinanceService(repository)

    await expect(
      service.voidInvoice('invoice-1', 'Created in error', { adminUserId: 'admin-1' })
    ).rejects.toMatchObject({ code: 'cannot_void_paid_invoice' })
    expect(repository.voidInvoice).not.toHaveBeenCalled()
  })
})
