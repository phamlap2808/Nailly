import type { CreateBookingInput } from '@nailly/shared'
import { createBookingSchema } from '@nailly/shared'
import { ApiError } from '../http/errors'

export class BookingService {
  constructor(
    private readonly repository: {
      getTotalDuration(serviceIds: string[]): Promise<number>
      isSlotAvailable(input: {
        staffId?: string | null
        appointmentDate: string
        startTime: string
        durationMinutes: number
      }): Promise<boolean>
      createBooking(input: ReturnType<typeof createBookingSchema.parse>, durationMinutes: number): Promise<{
        id: string
        status: string
      }>
    }
  ) {}

  async createPublicBooking(input: CreateBookingInput) {
    const parsed = createBookingSchema.parse(input)
    const durationMinutes = await this.repository.getTotalDuration(parsed.serviceIds)
    const available = await this.repository.isSlotAvailable({
      staffId: parsed.staffId,
      appointmentDate: parsed.appointmentDate,
      startTime: parsed.startTime,
      durationMinutes
    })

    if (!available) {
      throw new ApiError(409, 'slot_unavailable', 'This time is no longer available.')
    }

    return this.repository.createBooking(parsed, durationMinutes)
  }
}
