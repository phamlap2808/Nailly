import { describe, expect, it } from 'vitest'
import { buildBookingSummary } from '../utils/booking-summary'

const services = [
  { id: 'gel', name: 'Structured Gel Manicure', durationMins: 60, priceCents: 5800 },
  { id: 'art', name: 'Minimal Nail Art', durationMins: 75, priceCents: 7200 },
  { id: 'pedi', name: 'Restorative Pedicure', durationMins: 50, priceCents: 6400 }
]

describe('buildBookingSummary', () => {
  it('summarizes selected services with totals and labels', () => {
    expect(
      buildBookingSummary({
        services,
        selectedServiceIds: ['gel', 'art'],
        appointmentDate: '2026-06-03',
        startTime: '10:30',
        partySize: 2
      })
    ).toEqual({
      selectedServices: [services[0], services[1]],
      serviceLabel: 'Structured Gel Manicure + 1 more',
      durationLabel: '135 min',
      totalPriceCents: 13000,
      dateLabel: '2026-06-03',
      timeLabel: '10:30',
      partyLabel: '2 guests'
    })
  })

  it('uses empty-state labels before the customer has selected details', () => {
    expect(
      buildBookingSummary({
        services,
        selectedServiceIds: [],
        appointmentDate: '',
        startTime: null,
        partySize: 1
      })
    ).toEqual({
      selectedServices: [],
      serviceLabel: 'Choose services',
      durationLabel: 'Select services',
      totalPriceCents: 0,
      dateLabel: 'Choose a date',
      timeLabel: 'Choose a time',
      partyLabel: '1 guest'
    })
  })
})
