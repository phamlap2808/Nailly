import { describe, expect, it } from 'vitest'
import {
  adminRoleSchema,
  bookingStatusSchema,
  createBookingSchema,
  publicAvailabilityQuerySchema
} from './schemas'

describe('shared schemas', () => {
  it('accepts only supported admin roles', () => {
    expect(adminRoleSchema.parse('owner')).toBe('owner')
    expect(adminRoleSchema.safeParse('customer').success).toBe(false)
  })

  it('keeps public bookings in the pending confirmation workflow', () => {
    expect(bookingStatusSchema.parse('pending_confirmation')).toBe('pending_confirmation')
    expect(bookingStatusSchema.safeParse('draft').success).toBe(false)
  })

  it('validates a public booking request without requiring a customer account', () => {
    const parsed = createBookingSchema.parse({
      customerName: 'Avery Stone',
      phone: '+1 555 0100',
      email: 'avery@example.com',
      partySize: 2,
      serviceIds: ['svc-gel-manicure'],
      staffId: 'staff-maya',
      appointmentDate: '2026-06-03',
      startTime: '10:30',
      note: 'Prefers a quiet technician'
    })

    expect(parsed.status).toBe('pending_confirmation')
  })

  it('validates availability queries with ISO date and service IDs', () => {
    const parsed = publicAvailabilityQuerySchema.parse({
      date: '2026-06-03',
      serviceIds: ['svc-gel-manicure', 'svc-nail-art']
    })

    expect(parsed.serviceIds).toHaveLength(2)
  })
})
