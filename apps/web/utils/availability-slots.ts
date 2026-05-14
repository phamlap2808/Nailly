export interface AvailabilitySlot {
  time: string
  available: boolean
}

export function getAvailabilitySlotState(slots: AvailabilitySlot[]) {
  return {
    times: slots.map((slot) => slot.time),
    unavailableSlots: new Set(slots.filter((slot) => !slot.available).map((slot) => slot.time))
  }
}

export function hasAvailableSlot(slots: AvailabilitySlot[], time: string | null) {
  return typeof time === 'string' && slots.some((slot) => slot.time === time && slot.available)
}
