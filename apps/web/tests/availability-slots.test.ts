import { describe, expect, it } from 'vitest'
import { getAvailabilitySlotState, hasAvailableSlot } from '../utils/availability-slots'

describe('availability slot helpers', () => {
  const slots = [
    { time: '09:00', available: true },
    { time: '09:30', available: false },
    { time: '10:00', available: true }
  ]

  it('keeps API slot objects as displayable times with disabled unavailable slots', () => {
    const state = getAvailabilitySlotState(slots)

    expect(state.times).toEqual(['09:00', '09:30', '10:00'])
    expect([...state.unavailableSlots]).toEqual(['09:30'])
  })

  it('only treats an available API slot as a valid selection', () => {
    expect(hasAvailableSlot(slots, '09:00')).toBe(true)
    expect(hasAvailableSlot(slots, '09:30')).toBe(false)
    expect(hasAvailableSlot(slots, null)).toBe(false)
  })
})
