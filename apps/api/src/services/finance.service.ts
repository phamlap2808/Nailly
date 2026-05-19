import {
  invoiceCreateSchema,
  invoicePaymentSchema,
  invoiceRefundSchema,
  type InvoiceCreateInput,
  type InvoicePaymentInput,
  type InvoiceRefundInput
} from '@nailly/shared'
import { ApiError } from '../http/errors'
import { calculateInvoiceTotals } from './finance-math'
import {
  validatePromotionForSubtotal,
  type PromotionForValidation
} from './promotion.service'

export interface FinanceRepository {
  getFinanceSettings(): Promise<{ taxRateBps: number; invoicePrefix: string }>
  getServiceById(id: string): Promise<{ id: string; name: string; priceCents: number } | null>
  getStaffById(id: string): Promise<{ id: string; commissionRateBps: number } | null>
  createInvoice(input: Record<string, unknown>): Promise<unknown>
  getInvoiceWithItems(id: string): Promise<any | null>
  addPayment(invoiceId: string, input: Record<string, unknown>): Promise<unknown>
  addRefund(invoiceId: string, input: Record<string, unknown>): Promise<unknown>
  voidInvoice(invoiceId: string, input: { reason: string; adminUserId: string }): Promise<unknown>
  getPromotionByCode(code: string): Promise<PromotionForValidation | null>
  incrementPromotionUsage(code: string): Promise<unknown>
}

export interface FinanceActor {
  adminUserId: string
}

export function createFinanceService(repository: FinanceRepository) {
  return {
    async createInvoice(input: InvoiceCreateInput, actor: FinanceActor) {
      const parsed = invoiceCreateSchema.parse(input)
      const settings = await repository.getFinanceSettings()

      const items = []
      const mathItems = []

      for (const [index, item] of parsed.items.entries()) {
        let commissionRateBps = 0

        if (item.itemType === 'service') {
          if (!item.serviceId) {
            throw new ApiError(400, 'invalid_service', 'Service items must reference a valid service.')
          }

          const service = await repository.getServiceById(item.serviceId)
          if (!service) {
            throw new ApiError(400, 'invalid_service', 'Service items must reference a valid service.')
          }
        }

        if (item.staffId) {
          const staff = await repository.getStaffById(item.staffId)
          if (!staff) {
            throw new ApiError(400, 'invalid_staff', 'Invoice items must reference a valid staff member.')
          }
          commissionRateBps = staff.commissionRateBps
        }

        const lineTotalCents = item.quantity * item.unitPriceCents
        items.push({
          ...item,
          description: item.description || undefined,
          serviceId: item.serviceId ?? null,
          staffId: item.staffId ?? null,
          lineTotalCents,
          commissionRateBps,
          sortOrder: index + 1
        })
        mathItems.push({
          quantity: item.quantity,
          unitPriceCents: item.unitPriceCents,
          commissionRateBps
        })
      }

      const subtotalCents = mathItems.reduce((sum, item) => sum + item.quantity * item.unitPriceCents, 0)
      let discountCents = parsed.discountCents
      let discountReason = parsed.discountReason || undefined

      if (parsed.promotionCode) {
        const promotion = await repository.getPromotionByCode(parsed.promotionCode)
        const validation = validatePromotionForSubtotal(promotion, subtotalCents)

        if (!validation.valid) {
          throw new ApiError(400, 'invalid_promotion', validation.message)
        }

        discountCents = validation.discountCents
        discountReason = validation.discountReason
      }

      const totals = calculateInvoiceTotals({
        items: mathItems,
        discountCents,
        taxRateBps: settings.taxRateBps,
        tipCents: parsed.tipCents,
        paidCents: 0,
        refundedCents: 0
      })

      const invoice = await repository.createInvoice({
        ...parsed,
        customerPhone: parsed.customerPhone || undefined,
        customerEmail: parsed.customerEmail || undefined,
        discountReason,
        createdBy: actor.adminUserId,
        taxRateBps: settings.taxRateBps,
        subtotalCents: totals.subtotalCents,
        discountCents: totals.discountCents,
        taxableSubtotalCents: totals.taxableSubtotalCents,
        taxCents: totals.taxCents,
        tipCents: totals.tipCents,
        totalCents: totals.totalCents,
        paidCents: totals.paidCents,
        refundedCents: totals.refundedCents,
        netCollectedCents: totals.netCollectedCents,
        items: items.map((item, index) => ({
          ...item,
          commissionCents: totals.itemCommissions[index] ?? 0
        }))
      })

      if (parsed.promotionCode) {
        await repository.incrementPromotionUsage(parsed.promotionCode)
      }

      return invoice
    },

    async addPayment(invoiceId: string, input: InvoicePaymentInput, actor: FinanceActor) {
      const parsed = invoicePaymentSchema.parse(input)
      return repository.addPayment(invoiceId, {
        ...parsed,
        reference: parsed.reference || undefined,
        note: parsed.note || undefined,
        createdBy: actor.adminUserId
      })
    },

    async refundInvoice(invoiceId: string, input: InvoiceRefundInput, actor: FinanceActor) {
      const parsed = invoiceRefundSchema.parse(input)
      const invoice = await repository.getInvoiceWithItems(invoiceId)

      if (!invoice) {
        throw new ApiError(404, 'not_found', 'Invoice not found.')
      }

      const refundableCents = invoice.paidCents - invoice.refundedCents
      if (parsed.amountCents > refundableCents) {
        throw new ApiError(400, 'refund_too_large', 'Refund amount exceeds the refundable balance.')
      }

      return repository.addRefund(invoiceId, {
        ...parsed,
        paymentId: parsed.paymentId ?? undefined,
        createdBy: actor.adminUserId
      })
    },

    async voidInvoice(invoiceId: string, reason: string, actor: FinanceActor) {
      const invoice = await repository.getInvoiceWithItems(invoiceId)

      if (!invoice) {
        throw new ApiError(404, 'not_found', 'Invoice not found.')
      }

      if (invoice.paidCents > 0) {
        throw new ApiError(400, 'cannot_void_paid_invoice', 'Paid invoices cannot be voided.')
      }

      return repository.voidInvoice(invoiceId, {
        reason,
        adminUserId: actor.adminUserId
      })
    }
  }
}
