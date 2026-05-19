import type { CreateBookingInput } from '@nailly/shared'

export function buildBookingPayload(input: CreateBookingInput): CreateBookingInput {
  return {
    customerName: input.customerName,
    phone: input.phone,
    ...(input.email ? { email: input.email } : {}),
    partySize: input.partySize,
    serviceIds: input.serviceIds,
    staffId: input.staffId ?? null,
    appointmentDate: input.appointmentDate,
    startTime: input.startTime,
    ...(input.promotionCode ? { promotionCode: input.promotionCode } : {}),
    ...(input.note ? { note: input.note } : {})
  }
}
