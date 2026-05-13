import { describe, expect, it } from 'vitest'
import { buildTimeSlots } from './availability.service'

describe('buildTimeSlots', () => {
  it('builds 30-minute slots inside business hours and leaves room for service duration', () => {
    const slots = buildTimeSlots({
      startTime: '09:00',
      endTime: '11:00',
      durationMinutes: 60,
      blockedStarts: new Set(['09:30'])
    })

    expect(slots).toEqual([
      { time: '09:00', available: true },
      { time: '09:30', available: false },
      { time: '10:00', available: true }
    ])
  })
})
