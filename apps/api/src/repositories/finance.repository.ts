import { desc, eq, sql } from 'drizzle-orm'
import { createDb } from '../db/client'
import {
  invoiceItems,
  invoices,
  payments,
  refunds,
  services,
  shopSettings,
  staff
} from '../db/schema'

type FinanceInvoiceItemInput = {
  itemType: 'service' | 'manual'
  serviceId?: string | null
  staffId?: string | null
  name: string
  description?: string
  quantity: number
  unitPriceCents: number
  lineTotalCents: number
  commissionRateBps: number
  commissionCents: number
  sortOrder: number
}

type FinanceInvoiceInput = {
  source: 'booking' | 'walk_in'
  bookingId?: string | null
  customerName: string
  customerPhone?: string
  customerEmail?: string
  discountCents: number
  discountReason?: string
  taxRateBps: number
  taxCents: number
  tipCents: number
  subtotalCents: number
  totalCents: number
  createdBy: string
  items: FinanceInvoiceItemInput[]
}

type FinancePaymentInput = {
  method: 'cash' | 'credit_card' | 'debit_card' | 'zelle' | 'venmo' | 'gift_card' | 'other'
  amountCents: number
  reference?: string
  note?: string
  paidAt?: string
  createdBy: string
}

type FinanceRefundInput = {
  paymentId?: string | null
  method: 'cash' | 'credit_card' | 'debit_card' | 'zelle' | 'venmo' | 'gift_card' | 'other'
  amountCents: number
  reason: string
  refundedAt?: string
  createdBy: string
}

export function createFinanceRepository(databaseUrl?: string) {
  const { db } = createDb(databaseUrl)

  async function nextInvoiceNumber(prefix: string): Promise<string> {
    const rows = await db.select({ id: invoices.id }).from(invoices)
    return `${prefix}-${String(rows.length + 1).padStart(6, '0')}`
  }

  async function getFinanceSettings() {
    const rows = await db
      .select({
        taxRateBps: shopSettings.taxRateBps,
        invoicePrefix: shopSettings.invoicePrefix
      })
      .from(shopSettings)
      .limit(1)

    return rows[0] ?? { taxRateBps: 0, invoicePrefix: 'INV' }
  }

  return {
    getFinanceSettings,

    async getServiceById(id: string) {
      const rows = await db
        .select({
          id: services.id,
          name: services.name,
          priceCents: services.priceCents
        })
        .from(services)
        .where(eq(services.id, id))
        .limit(1)

      return rows[0] ?? null
    },

    async getStaffById(id: string) {
      const rows = await db
        .select({
          id: staff.id,
          commissionRateBps: staff.commissionRateBps
        })
        .from(staff)
        .where(eq(staff.id, id))
        .limit(1)

      return rows[0] ?? null
    },

    async createInvoice(input: Record<string, unknown>) {
      const invoiceInput = input as FinanceInvoiceInput

      return db.transaction(async (tx) => {
        const settings = await getFinanceSettings()
        const invoiceNumber = await nextInvoiceNumber(settings.invoicePrefix)
        const now = new Date()

        const [invoice] = await tx
          .insert(invoices)
          .values({
            invoiceNumber,
            source: invoiceInput.source,
            bookingId: invoiceInput.bookingId ?? null,
            customerName: invoiceInput.customerName,
            customerPhone: invoiceInput.customerPhone || null,
            customerEmail: invoiceInput.customerEmail || null,
            status: 'open',
            subtotalCents: invoiceInput.subtotalCents,
            discountCents: invoiceInput.discountCents,
            discountReason: invoiceInput.discountReason || null,
            taxRateBps: invoiceInput.taxRateBps,
            taxCents: invoiceInput.taxCents,
            tipCents: invoiceInput.tipCents,
            totalCents: invoiceInput.totalCents,
            paidCents: 0,
            refundedCents: 0,
            issuedAt: now,
            createdBy: invoiceInput.createdBy,
            updatedBy: invoiceInput.createdBy,
            updatedAt: now
          })
          .returning()

        if (invoiceInput.items.length > 0) {
          await tx.insert(invoiceItems).values(
            invoiceInput.items.map((item) => ({
              invoiceId: invoice.id,
              itemType: item.itemType,
              serviceId: item.serviceId ?? null,
              staffId: item.staffId ?? null,
              name: item.name,
              description: item.description || null,
              quantity: item.quantity,
              unitPriceCents: item.unitPriceCents,
              lineTotalCents: item.lineTotalCents,
              commissionRateBps: item.commissionRateBps,
              commissionCents: item.commissionCents,
              sortOrder: item.sortOrder
            }))
          )
        }

        return invoice
      })
    },

    async getInvoiceWithItems(id: string) {
      const invoiceRows = await db.select().from(invoices).where(eq(invoices.id, id)).limit(1)
      const invoice = invoiceRows[0]

      if (!invoice) {
        return null
      }

      const items = await db
        .select()
        .from(invoiceItems)
        .where(eq(invoiceItems.invoiceId, id))
        .orderBy(invoiceItems.sortOrder)
      const paymentRows = await db.select().from(payments).where(eq(payments.invoiceId, id))
      const refundRows = await db.select().from(refunds).where(eq(refunds.invoiceId, id))

      return {
        ...invoice,
        items,
        payments: paymentRows,
        refunds: refundRows
      }
    },

    async addPayment(invoiceId: string, input: Record<string, unknown>) {
      const paymentInput = input as FinancePaymentInput

      return db.transaction(async (tx) => {
        const now = new Date()
        const paidAt = paymentInput.paidAt ? new Date(paymentInput.paidAt) : now
        const [payment] = await tx
          .insert(payments)
          .values({
            invoiceId,
            method: paymentInput.method,
            amountCents: paymentInput.amountCents,
            reference: paymentInput.reference || null,
            note: paymentInput.note || null,
            paidAt,
            createdBy: paymentInput.createdBy
          })
          .returning()

        await tx
          .update(invoices)
          .set({
            paidCents: sql`${invoices.paidCents} + ${paymentInput.amountCents}`,
            status: 'paid',
            paidAt,
            updatedAt: now,
            updatedBy: paymentInput.createdBy
          })
          .where(eq(invoices.id, invoiceId))

        return payment
      })
    },

    async addRefund(invoiceId: string, input: Record<string, unknown>) {
      const refundInput = input as FinanceRefundInput

      return db.transaction(async (tx) => {
        const now = new Date()
        const refundedAt = refundInput.refundedAt ? new Date(refundInput.refundedAt) : now
        const [refund] = await tx
          .insert(refunds)
          .values({
            invoiceId,
            paymentId: refundInput.paymentId ?? null,
            method: refundInput.method,
            amountCents: refundInput.amountCents,
            reason: refundInput.reason,
            refundedAt,
            createdBy: refundInput.createdBy
          })
          .returning()

        await tx
          .update(invoices)
          .set({
            refundedCents: sql`${invoices.refundedCents} + ${refundInput.amountCents}`,
            status: 'partially_refunded',
            updatedAt: now,
            updatedBy: refundInput.createdBy
          })
          .where(eq(invoices.id, invoiceId))

        return refund
      })
    },

    async voidInvoice(invoiceId: string, input: { reason: string; adminUserId: string }) {
      const [invoice] = await db
        .update(invoices)
        .set({
          status: 'void',
          voidReason: input.reason,
          voidedAt: new Date(),
          updatedAt: new Date(),
          updatedBy: input.adminUserId
        })
        .where(eq(invoices.id, invoiceId))
        .returning()

      return invoice ?? null
    },

    async listInvoices() {
      return db.select().from(invoices).orderBy(desc(invoices.createdAt))
    }
  }
}
