import { z } from 'zod'
import {
  adminPermissionValues as adminPermissionSchemaValues,
  adminRoleValues as adminRoleSchemaValues
} from './permissions'

export const adminRoleSchema = z.enum(adminRoleSchemaValues)
export const adminPermissionSchema = z.enum(adminPermissionSchemaValues)
export {
  adminPermissionValues,
  adminRoleValues,
  defaultRolePermissions,
  hasPermission,
  permissionsForRole
} from './permissions'
export type { AdminPermission, AdminRole } from './permissions'

export const bookingStatusValues = [
  'pending_confirmation',
  'confirmed',
  'cancelled',
  'completed',
  'no_show'
] as const
export const bookingStatusSchema = z.enum(bookingStatusValues)
export type BookingStatus = z.infer<typeof bookingStatusSchema>

export const isoDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD')
export const timeSlotSchema = z.string().regex(/^\d{2}:\d{2}$/, 'Use HH:mm')
export const promotionCodeSchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-Z0-9][A-Z0-9_-]{1,31}$/, 'Use 2-32 letters, numbers, dashes, or underscores')
export const optionalPromotionCodeSchema = z
  .string()
  .trim()
  .toUpperCase()
  .optional()
  .or(z.literal(''))
  .transform((value) => (value === '' || value === undefined ? undefined : promotionCodeSchema.parse(value)))

export const serviceSchema = z.object({
  id: z.string().min(1),
  categoryId: z.string().min(1),
  name: z.string().min(1),
  description: z.string().min(1),
  durationMinutes: z.number().int().min(15).max(480),
  priceCents: z.number().int().min(0),
  active: z.boolean(),
  imageUrl: z.string().url().nullable()
})
export type Service = z.infer<typeof serviceSchema>

export const staffSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  title: z.string().min(1),
  bio: z.string().min(1),
  active: z.boolean(),
  imageUrl: z.string().url().nullable()
})
export type Staff = z.infer<typeof staffSchema>

export const createBookingSchema = z
  .object({
    customerName: z.string().trim().min(2).max(120),
    phone: z.string().trim().min(7).max(30),
    email: z.string().trim().email().optional().or(z.literal('')),
    partySize: z.number().int().min(1).max(8).default(1),
    serviceIds: z.array(z.string().min(1)).min(1),
    staffId: z.string().min(1).optional().nullable(),
    appointmentDate: isoDateSchema,
    startTime: timeSlotSchema,
    note: z.string().trim().max(1000).optional().or(z.literal('')),
    promotionCode: optionalPromotionCodeSchema,
    status: bookingStatusSchema.default('pending_confirmation')
  })
  .transform((value) => ({
    ...value,
    email: value.email === '' ? undefined : value.email,
    note: value.note === '' ? undefined : value.note,
    promotionCode: value.promotionCode,
    status: 'pending_confirmation' as const
  }))
export type CreateBookingInput = z.input<typeof createBookingSchema>
export type CreateBooking = z.output<typeof createBookingSchema>

export const publicAvailabilityQuerySchema = z.object({
  date: isoDateSchema,
  serviceIds: z
    .union([z.array(z.string().min(1)), z.string().min(1)])
    .transform((value) => (Array.isArray(value) ? value : value.split(',').filter(Boolean))),
  staffId: z.string().min(1).optional()
})
export type PublicAvailabilityQuery = z.output<typeof publicAvailabilityQuerySchema>

export const invoiceStatusValues = [
  'draft',
  'open',
  'paid',
  'partially_refunded',
  'refunded',
  'void'
] as const
export const invoiceStatusSchema = z.enum(invoiceStatusValues)
export type InvoiceStatus = z.infer<typeof invoiceStatusSchema>

export const invoiceSourceValues = ['booking', 'walk_in'] as const
export const invoiceSourceSchema = z.enum(invoiceSourceValues)
export type InvoiceSource = z.infer<typeof invoiceSourceSchema>

export const invoiceItemTypeValues = ['service', 'manual'] as const
export const invoiceItemTypeSchema = z.enum(invoiceItemTypeValues)
export type InvoiceItemType = z.infer<typeof invoiceItemTypeSchema>

export const financePaymentMethodValues = [
  'cash',
  'credit_card',
  'debit_card',
  'zelle',
  'venmo',
  'gift_card',
  'other'
] as const
export const financePaymentMethodSchema = z.enum(financePaymentMethodValues)
export type FinancePaymentMethod = z.infer<typeof financePaymentMethodSchema>

const moneyCentsSchema = z.number().int().min(0)
const basisPointsSchema = z.number().int().min(0).max(10000)

export const promotionDiscountTypeValues = ['percent', 'fixed'] as const
export const promotionDiscountTypeSchema = z.enum(promotionDiscountTypeValues)
export type PromotionDiscountType = z.infer<typeof promotionDiscountTypeSchema>

export const promotionSchema = z.object({
  code: promotionCodeSchema,
  name: z.string().trim().min(1).max(120),
  discountType: promotionDiscountTypeSchema,
  discountValue: z.number().int().min(1).max(1000000),
  minSubtotalCents: moneyCentsSchema.default(0),
  maxDiscountCents: moneyCentsSchema.optional().nullable(),
  startsAt: z.string().datetime().optional().nullable(),
  endsAt: z.string().datetime().optional().nullable(),
  usageLimit: z.number().int().min(1).optional().nullable(),
  active: z.boolean().default(true)
}).superRefine((value, ctx) => {
  if (value.discountType === 'percent' && value.discountValue > 100) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['discountValue'],
      message: 'Percent promotions cannot exceed 100'
    })
  }
})
export type PromotionInput = z.input<typeof promotionSchema>
export type Promotion = z.output<typeof promotionSchema>

export const promotionValidationSchema = z.object({
  code: promotionCodeSchema,
  subtotalCents: moneyCentsSchema
})
export type PromotionValidationInput = z.input<typeof promotionValidationSchema>
export type PromotionValidation = z.output<typeof promotionValidationSchema>

const optionalBannerText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .nullable()
    .transform((value) => (value ? value : null))

export const bannerSchema = z.object({
  imageId: z
    .string()
    .trim()
    .optional()
    .nullable()
    .transform((value) => (value ? value : null)),
  eyebrow: z.string().trim().max(80).optional().nullable().transform((value) => value ?? ''),
  title: z.string().trim().min(1).max(140),
  subtitle: z.string().trim().max(280).optional().nullable().transform((value) => value ?? ''),
  primaryLabel: z.string().trim().min(1).max(48).default('Book appointment'),
  primaryHref: z.string().trim().min(1).max(240).default('/booking'),
  secondaryLabel: optionalBannerText(48),
  secondaryHref: optionalBannerText(240),
  sortOrder: z.number().int().min(0).max(1000).default(0),
  active: z.boolean().default(true)
})
export const bannerPatchSchema = bannerSchema.partial()
export type BannerInput = z.input<typeof bannerSchema>
export type Banner = z.output<typeof bannerSchema>
export type BannerPatch = z.output<typeof bannerPatchSchema>

export const invoiceItemInputSchema = z.object({
  itemType: invoiceItemTypeSchema,
  serviceId: z.string().min(1).nullable().optional(),
  staffId: z.string().min(1).nullable().optional(),
  name: z.string().trim().min(1).max(160),
  description: z.string().trim().max(500).optional().or(z.literal('')),
  quantity: z.number().int().min(1).max(99),
  unitPriceCents: moneyCentsSchema
})
export type InvoiceItemInput = z.infer<typeof invoiceItemInputSchema>

export const invoiceCreateSchema = z.object({
  source: invoiceSourceSchema,
  bookingId: z.string().min(1).optional().nullable(),
  customerName: z.string().trim().min(1).max(160),
  customerPhone: z.string().trim().max(40).optional().or(z.literal('')),
  customerEmail: z.string().trim().email().optional().or(z.literal('')),
  items: z.array(invoiceItemInputSchema).min(1),
  discountCents: moneyCentsSchema.default(0),
  discountReason: z.string().trim().max(240).optional().or(z.literal('')),
  promotionCode: optionalPromotionCodeSchema,
  tipCents: moneyCentsSchema.default(0)
})
export type InvoiceCreateInput = z.input<typeof invoiceCreateSchema>
export type InvoiceCreate = z.output<typeof invoiceCreateSchema>

export const invoicePaymentSchema = z.object({
  method: financePaymentMethodSchema,
  amountCents: moneyCentsSchema.min(1),
  reference: z.string().trim().max(120).optional().or(z.literal('')),
  note: z.string().trim().max(500).optional().or(z.literal('')),
  paidAt: z.string().datetime().optional()
})
export type InvoicePaymentInput = z.input<typeof invoicePaymentSchema>
export type InvoicePayment = z.output<typeof invoicePaymentSchema>

export const invoiceRefundSchema = z.object({
  paymentId: z.string().min(1).optional().nullable(),
  method: financePaymentMethodSchema,
  amountCents: moneyCentsSchema.min(1),
  reason: z.string().trim().min(3).max(500),
  refundedAt: z.string().datetime().optional()
})
export type InvoiceRefundInput = z.input<typeof invoiceRefundSchema>
export type InvoiceRefund = z.output<typeof invoiceRefundSchema>

export const financeSettingsSchema = z.object({
  taxRateBps: basisPointsSchema,
  receiptFooter: z.string().trim().max(500).optional().or(z.literal('')),
  invoicePrefix: z.string().trim().min(1).max(12)
})
export type FinanceSettings = z.infer<typeof financeSettingsSchema>

export const apiErrorSchema = z.object({
  code: z.string(),
  message: z.string(),
  fields: z.record(z.string()).optional()
})
export type ApiError = z.infer<typeof apiErrorSchema>
