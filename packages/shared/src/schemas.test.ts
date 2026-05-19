import { describe, expect, it } from 'vitest'
import {
  adminPermissionSchema,
  defaultRolePermissions,
  hasPermission,
  adminRoleSchema,
  permissionsForRole,
  bookingStatusSchema,
  createBookingSchema,
  bannerSchema,
  financePaymentMethodSchema,
  invoiceCreateSchema,
  invoiceRefundSchema,
  invoiceStatusSchema,
  promotionSchema,
  promotionValidationSchema,
  publicAvailabilityQuerySchema
} from './schemas'

describe('shared schemas', () => {
  it('accepts only supported admin roles', () => {
    expect(adminRoleSchema.parse('owner')).toBe('owner')
    expect(adminRoleSchema.safeParse('customer').success).toBe(false)
  })

  it('defines default admin permission sets by role', () => {
    expect(adminPermissionSchema.parse('permissions.manage')).toBe('permissions.manage')
    expect(adminPermissionSchema.safeParse('danger.zone').success).toBe(false)

    expect(hasPermission(defaultRolePermissions.owner, 'permissions.manage')).toBe(true)
    expect(hasPermission(defaultRolePermissions.manager, 'reports.export')).toBe(true)
    expect(hasPermission(defaultRolePermissions.manager, 'permissions.manage')).toBe(false)
    expect(hasPermission(defaultRolePermissions.staff, 'pos.use')).toBe(true)
    expect(hasPermission(defaultRolePermissions.staff, 'invoices.refund')).toBe(false)
    expect(permissionsForRole('owner').length).toBeGreaterThan(permissionsForRole('manager').length)
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
      note: 'Prefers a quiet technician',
      promotionCode: ' welcome10 '
    })

    expect(parsed.status).toBe('pending_confirmation')
    expect(parsed.promotionCode).toBe('WELCOME10')
  })

  it('validates availability queries with ISO date and service IDs', () => {
    const parsed = publicAvailabilityQuerySchema.parse({
      date: '2026-06-03',
      serviceIds: ['svc-gel-manicure', 'svc-nail-art']
    })

    expect(parsed.serviceIds).toHaveLength(2)
  })

  it('validates admin banner content for the public homepage hero', () => {
    const parsed = bannerSchema.parse({
      title: 'Fresh color for the new season',
      subtitle: 'Book a calm appointment for gel, pedicure, or tiny nail art.',
      eyebrow: 'Spring edit',
      imageId: '',
      primaryLabel: 'Book now',
      primaryHref: '/booking',
      secondaryLabel: 'See services',
      secondaryHref: '/#services',
      sortOrder: 2,
      active: true
    })

    expect(parsed.imageId).toBeNull()
    expect(parsed.primaryHref).toBe('/booking')
    expect(parsed.active).toBe(true)
  })
})

describe('finance schemas', () => {
  it('validates promotion definitions and public validation requests', () => {
    const parsed = promotionSchema.parse({
      code: 'spring-15',
      name: 'Spring 15%',
      discountType: 'percent',
      discountValue: 15,
      maxDiscountCents: 2000,
      minSubtotalCents: 5000,
      usageLimit: 100,
      active: true
    })

    expect(parsed.code).toBe('SPRING-15')
    expect(promotionValidationSchema.parse({ code: 'spring-15', subtotalCents: 9000 })).toEqual({
      code: 'SPRING-15',
      subtotalCents: 9000
    })
  })

  it('validates supported invoice statuses and payment methods', () => {
    expect(invoiceStatusSchema.parse('paid')).toBe('paid')
    expect(invoiceStatusSchema.parse('partially_refunded')).toBe('partially_refunded')
    expect(invoiceStatusSchema.safeParse('processing').success).toBe(false)

    expect(financePaymentMethodSchema.parse('credit_card')).toBe('credit_card')
    expect(financePaymentMethodSchema.parse('gift_card')).toBe('gift_card')
    expect(financePaymentMethodSchema.safeParse('crypto').success).toBe(false)
  })

  it('validates walk-in invoice creation with per-line staff assignment', () => {
    const parsed = invoiceCreateSchema.parse({
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
        },
        {
          itemType: 'manual',
          staffId: 'staff-2',
          name: 'Chrome Finish',
          quantity: 1,
          unitPriceCents: 1800
        }
      ],
      promotionCode: 'spring-15',
      tipCents: 1000
    })

    expect(parsed.source).toBe('walk_in')
    expect(parsed.items).toHaveLength(2)
    expect(parsed.items[0].staffId).toBe('staff-1')
    expect(parsed.promotionCode).toBe('SPRING-15')
  })

  it('validates refunds with amount, method, and reason', () => {
    expect(
      invoiceRefundSchema.parse({
        amountCents: 2000,
        method: 'cash',
        reason: 'Customer requested partial refund'
      })
    ).toEqual({
      amountCents: 2000,
      method: 'cash',
      reason: 'Customer requested partial refund'
    })
  })
})
