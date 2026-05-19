import { desc, eq, sql } from 'drizzle-orm'
import { createDb } from '../db/client'
import {
  invoiceItems,
  invoices,
  payments,
  promotions,
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

type PromotionInput = {
  code: string
  name: string
  discountType: 'percent' | 'fixed'
  discountValue: number
  minSubtotalCents: number
  maxDiscountCents?: number | null
  startsAt?: string | Date | null
  endsAt?: string | Date | null
  usageLimit?: number | null
  active: boolean
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

type RevenueSummaryInvoice = {
  totalCents: number
  refundedCents: number
  taxCents: number
  tipCents: number
}

export function getRefundStatusAfterRefund(
  invoice: { paidCents: number; refundedCents: number },
  refundAmountCents: number
) {
  const nextRefundedCents = invoice.refundedCents + refundAmountCents
  return nextRefundedCents >= invoice.paidCents ? 'refunded' : 'partially_refunded'
}

function summarizeRevenueInvoices(invoiceRows: RevenueSummaryInvoice[]) {
  return invoiceRows.reduce(
    (summary, invoice) => ({
      grossCents: summary.grossCents + invoice.totalCents,
      refundedCents: summary.refundedCents + invoice.refundedCents,
      netCents: summary.netCents + invoice.totalCents - invoice.refundedCents,
      taxCents: summary.taxCents + invoice.taxCents,
      tipCents: summary.tipCents + invoice.tipCents,
      invoiceCount: summary.invoiceCount + 1
    }),
    { grossCents: 0, refundedCents: 0, netCents: 0, taxCents: 0, tipCents: 0, invoiceCount: 0 }
  )
}

function nullableDate(value?: string | Date | null) {
  if (!value) return null
  return value instanceof Date ? value : new Date(value)
}

function promotionValues(input: PromotionInput) {
  return {
    code: input.code,
    name: input.name,
    discountType: input.discountType,
    discountValue: input.discountValue,
    minSubtotalCents: input.minSubtotalCents,
    maxDiscountCents: input.maxDiscountCents ?? null,
    startsAt: nullableDate(input.startsAt),
    endsAt: nullableDate(input.endsAt),
    usageLimit: input.usageLimit ?? null,
    active: input.active
  }
}

function partialPromotionValues(input: Partial<PromotionInput>) {
  const values: Record<string, unknown> = {}
  if (input.code !== undefined) values.code = input.code
  if (input.name !== undefined) values.name = input.name
  if (input.discountType !== undefined) values.discountType = input.discountType
  if (input.discountValue !== undefined) values.discountValue = input.discountValue
  if (input.minSubtotalCents !== undefined) values.minSubtotalCents = input.minSubtotalCents
  if (input.maxDiscountCents !== undefined) values.maxDiscountCents = input.maxDiscountCents ?? null
  if (input.startsAt !== undefined) values.startsAt = nullableDate(input.startsAt)
  if (input.endsAt !== undefined) values.endsAt = nullableDate(input.endsAt)
  if (input.usageLimit !== undefined) values.usageLimit = input.usageLimit ?? null
  if (input.active !== undefined) values.active = input.active
  return values
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
        const invoice = await tx
          .select()
          .from(invoices)
          .where(eq(invoices.id, invoiceId))
          .limit(1)
          .then((rows) => rows[0])
        const nextStatus = getRefundStatusAfterRefund(invoice, refundInput.amountCents)
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
            status: nextStatus,
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

    async listPromotions() {
      return db.select().from(promotions).orderBy(promotions.code)
    },

    async getPromotionByCode(code: string) {
      const rows = await db.select().from(promotions).where(eq(promotions.code, code)).limit(1)
      return rows[0] ?? null
    },

    async createPromotion(input: PromotionInput) {
      const [row] = await db.insert(promotions).values(promotionValues(input)).returning()
      return row
    },

    async updatePromotion(id: string, input: Partial<PromotionInput>) {
      const [row] = await db
        .update(promotions)
        .set({
          ...partialPromotionValues(input),
          updatedAt: new Date()
        })
        .where(eq(promotions.id, id))
        .returning()
      return row ?? null
    },

    async incrementPromotionUsage(code: string) {
      await db
        .update(promotions)
        .set({
          usedCount: sql`${promotions.usedCount} + 1`,
          updatedAt: new Date()
        })
        .where(eq(promotions.code, code))
    },

    async listInvoices() {
      return db.select().from(invoices).orderBy(desc(invoices.createdAt))
    },

    async listPayments() {
      return db.select().from(payments).orderBy(desc(payments.createdAt))
    },

    async listRefunds() {
      return db.select().from(refunds).orderBy(desc(refunds.createdAt))
    },

    async getRevenueReport() {
      const invoiceRows = await db.select().from(invoices).orderBy(desc(invoices.createdAt))
      const paymentRows = await db.select().from(payments).orderBy(desc(payments.createdAt))
      const refundRows = await db.select().from(refunds).orderBy(desc(refunds.createdAt))
      const itemRows = await db
        .select({
          id: invoiceItems.id,
          invoiceId: invoiceItems.invoiceId,
          itemType: invoiceItems.itemType,
          serviceId: invoiceItems.serviceId,
          staffId: invoiceItems.staffId,
          staffName: staff.name,
          name: invoiceItems.name,
          quantity: invoiceItems.quantity,
          lineTotalCents: invoiceItems.lineTotalCents,
          commissionCents: invoiceItems.commissionCents
        })
        .from(invoiceItems)
        .leftJoin(staff, eq(invoiceItems.staffId, staff.id))

      const payrollRows = Array.from(
        itemRows
          .filter((item) => item.staffId)
          .reduce((rows, item) => {
            const key = item.staffId ?? 'unassigned'
            const current = rows.get(key) ?? {
              staffId: item.staffId,
              staffName: item.staffName ?? 'Unassigned',
              salesCents: 0,
              commissionCents: 0,
              lineCount: 0
            }
            current.salesCents += item.lineTotalCents
            current.commissionCents += item.commissionCents
            current.lineCount += 1
            rows.set(key, current)
            return rows
          }, new Map<string, { staffId: string | null; staffName: string; salesCents: number; commissionCents: number; lineCount: number }>())
          .values()
      ).sort((a, b) => b.salesCents - a.salesCents)

      return {
        invoices: invoiceRows,
        payments: paymentRows,
        refunds: refundRows,
        items: itemRows,
        payrollRows,
        summary: summarizeRevenueInvoices(invoiceRows)
      }
    }
  }
}
