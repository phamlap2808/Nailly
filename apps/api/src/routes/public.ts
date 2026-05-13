import { Hono } from 'hono'
import { publicAvailabilityQuerySchema } from '@nailly/shared'
import { RedisJsonCache } from '../cache/redis'
import { createBookingRepository } from '../repositories/booking.repository'
import { createPublicSiteRepository } from '../repositories/public-site.repository'
import { buildTimeSlots } from '../services/availability.service'
import { BookingService } from '../services/booking.service'
import { PublicSiteService } from '../services/public-site.service'

export function publicRoutes(
  cache = new RedisJsonCache(),
  siteRepo = createPublicSiteRepository(),
  bookingRepo = createBookingRepository()
) {
  const router = new Hono()
  const siteService = new PublicSiteService(siteRepo, cache)
  const bookingService = new BookingService(bookingRepo)

  router.get('/site', async (c) => {
    const payload = await siteService.getPublicSite()
    return c.json(payload)
  })

  router.get('/availability', async (c) => {
    const query = publicAvailabilityQuerySchema.parse(c.req.query())
    const durationMinutes = await bookingRepo.getTotalDuration(query.serviceIds)
    const blockedStarts = new Set(
      await bookingRepo.getBlockedStartTimes({
        staffId: query.staffId ?? null,
        appointmentDate: query.date
      })
    )

    const slots = buildTimeSlots({
      startTime: '09:00',
      endTime: '19:30',
      durationMinutes,
      blockedStarts
    })

    return c.json({ date: query.date, slots })
  })

  router.post('/bookings', async (c) => {
    const body = await c.req.json()
    const result = await bookingService.createPublicBooking(body)

    return c.json(
      {
        bookingId: result.id,
        status: result.status,
        message: 'Request received. We will contact you to confirm your appointment.'
      },
      201
    )
  })

  return router
}
