import { describe, expect, it } from 'vitest'
import { getInvoiceStatusLabel, getPaymentMethodLabel } from '../utils/finance-format'

describe('finance format helpers', () => {
  it('formats invoice status labels', () => {
    expect(getInvoiceStatusLabel('partially_refunded')).toBe('Partially refunded')
    expect(getInvoiceStatusLabel('paid')).toBe('Paid')
  })

  it('formats payment method labels', () => {
    expect(getPaymentMethodLabel('credit_card')).toBe('Credit card')
    expect(getPaymentMethodLabel('gift_card')).toBe('Gift card')
  })
})
