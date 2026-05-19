import { describe, expect, it, vi } from 'vitest'
import { ApiError } from '../http/errors'
import { BookingService } from './booking.service'

describe('BookingService', () => {
  it('creates public bookings with pending confirmation status', async () => {
    const repository = {
      getTotalDuration: vi.fn().mockResolvedValue(60),
      isSlotAvailable: vi.fn().mockResolvedValue(true),
      createBooking: vi.fn().mockResolvedValue({ id: 'booking-1', status: 'pending_confirmation' })
    }

    const service = new BookingService(repository)
    const result = await service.createPublicBooking({
      customerName: 'Avery Stone',
      phone: '+1 555 0100',
      partySize: 1,
      serviceIds: ['svc-1'],
      staffId: 'staff-1',
      appointmentDate: '2026-06-03',
      startTime: '10:00',
      promotionCode: 'welcome10'
    })

    expect(result.status).toBe('pending_confirmation')
    expect(repository.createBooking).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'pending_confirmation', promotionCode: 'WELCOME10' }),
      60
    )
  })

  it('rejects bookings when the slot is no longer available', async () => {
    const repository = {
      getTotalDuration: vi.fn().mockResolvedValue(60),
      isSlotAvailable: vi.fn().mockResolvedValue(false),
      createBooking: vi.fn()
    }

    const service = new BookingService(repository)

    await expect(
      service.createPublicBooking({
        customerName: 'Avery Stone',
        phone: '+1 555 0100',
        partySize: 1,
        serviceIds: ['svc-1'],
        staffId: 'staff-1',
        appointmentDate: '2026-06-03',
        startTime: '10:00'
      })
    ).rejects.toEqual(new ApiError(409, 'slot_unavailable', 'This time is no longer available.'))
  })
})
