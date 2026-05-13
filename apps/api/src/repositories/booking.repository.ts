import { and, eq, inArray } from 'drizzle-orm'
import { createBookingSchema } from '@nailly/shared'
import { createDb } from '../db/client'
import {
  availabilityRules,
  bookings,
  bookingServices,
  services,
  staffServices
} from '../db/schema'

function toMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

function toTime(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`
}

export function createBookingRepository(databaseUrl?: string) {
  const { db } = createDb(databaseUrl)

  return {
    async getTotalDuration(serviceIds: string[]): Promise<number> {
      const rows = await db
        .select({ durationMinutes: services.durationMinutes })
        .from(services)
        .where(inArray(services.id, serviceIds))

      return rows.reduce((sum, r) => sum + r.durationMinutes, 0)
    },

    async getBlockedStartTimes(input: {
      staffId?: string | null
      appointmentDate: string
    }): Promise<string[]> {
      const conditions = [
        eq(bookings.appointmentDate, input.appointmentDate),
        eq(bookings.status, 'confirmed')
      ]

      if (input.staffId) {
        conditions.push(eq(bookings.staffId, input.staffId))
      }

      const rows = await db
        .select({ startTime: bookings.startTime })
        .from(bookings)
        .where(and(...conditions))

      return rows.map((r) => r.startTime)
    },

    async isSlotAvailable(input: {
      staffId?: string | null
      appointmentDate: string
      startTime: string
      durationMinutes: number
    }): Promise<boolean> {
      const date = new Date(input.appointmentDate + 'T00:00:00')
      const dayOfWeek = date.getDay()

      if (input.staffId) {
        const rules = await db
          .select()
          .from(availabilityRules)
          .where(
            and(
              eq(availabilityRules.staffId, input.staffId),
              eq(availabilityRules.dayOfWeek, dayOfWeek),
              eq(availabilityRules.active, true)
            )
          )

        if (rules.length === 0) return false

        const rule = rules[0]
        const requestStart = toMinutes(input.startTime)
        const requestEnd = requestStart + input.durationMinutes
        const availStart = toMinutes(rule.startTime)
        const availEnd = toMinutes(rule.endTime)

        if (requestStart < availStart || requestEnd > availEnd) return false
      } else {
        // No staff preference: find any active staff who can do all requested services
        // For availability query, if no staffId, check if any staff is available
        const allRules = await db
          .select()
          .from(availabilityRules)
          .where(
            and(
              eq(availabilityRules.dayOfWeek, dayOfWeek),
              eq(availabilityRules.active, true)
            )
          )

        if (allRules.length === 0) return false

        const anyWorks = allRules.some((rule) => {
          const requestStart = toMinutes(input.startTime)
          const requestEnd = requestStart + input.durationMinutes
          const availStart = toMinutes(rule.startTime)
          const availEnd = toMinutes(rule.endTime)
          return requestStart >= availStart && requestEnd <= availEnd
        })

        if (!anyWorks) return false
      }

      // Check no conflicting confirmed bookings
      const blockedStarts = await this.getBlockedStartTimes(input as { staffId?: string | null; appointmentDate: string })
      return !blockedStarts.includes(input.startTime)
    },

    async createBooking(
      input: ReturnType<typeof createBookingSchema.parse>,
      durationMinutes: number
    ) {
      const endMinutes = toMinutes(input.startTime) + durationMinutes
      return db.transaction(async (tx) => {
        const [booking] = await tx
          .insert(bookings)
          .values({
            staffId: input.staffId ?? null,
            customerName: input.customerName,
            phone: input.phone,
            email: input.email ?? null,
            partySize: input.partySize,
            appointmentDate: input.appointmentDate,
            startTime: input.startTime,
            endTime: toTime(endMinutes),
            status: 'pending_confirmation',
            note: input.note ?? null
          })
          .returning({ id: bookings.id, status: bookings.status })

        await tx.insert(bookingServices).values(
          input.serviceIds.map((serviceId) => ({
            bookingId: booking.id,
            serviceId
          }))
        )

        return booking
      })
    }
  }
}
