import { describe, expect, it } from 'vitest'
import { buildBookingPayload } from '../utils/booking-payload'

describe('buildBookingPayload', () => {
  it('creates public booking payload with optional email and note omitted when blank', () => {
    expect(
      buildBookingPayload({
        customerName: 'Avery Stone',
        phone: '+1 555 0100',
        email: '',
        note: '',
        partySize: 1,
        serviceIds: ['svc-1'],
        staffId: null,
        appointmentDate: '2026-06-03',
        startTime: '10:00'
      })
    ).toEqual({
      customerName: 'Avery Stone',
      phone: '+1 555 0100',
      partySize: 1,
      serviceIds: ['svc-1'],
      staffId: null,
      appointmentDate: '2026-06-03',
      startTime: '10:00'
    })
  })
})
