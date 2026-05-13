import { z } from 'zod'

export const adminRoleValues = ['owner', 'manager', 'staff'] as const
export const adminRoleSchema = z.enum(adminRoleValues)
export type AdminRole = z.infer<typeof adminRoleSchema>

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
    status: bookingStatusSchema.default('pending_confirmation')
  })
  .transform((value) => ({
    ...value,
    email: value.email === '' ? undefined : value.email,
    note: value.note === '' ? undefined : value.note,
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

export const apiErrorSchema = z.object({
  code: z.string(),
  message: z.string(),
  fields: z.record(z.string()).optional()
})
export type ApiError = z.infer<typeof apiErrorSchema>
