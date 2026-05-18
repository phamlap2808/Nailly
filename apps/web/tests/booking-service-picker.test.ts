import { describe, expect, it } from 'vitest'
import { filterBookingServices } from '../utils/booking-service-picker'

const services = [
  {
    id: 'gel',
    name: 'Gel Manicure',
    description: 'Long-wear gel color with precise cuticle care.',
    durationMinutes: 60,
    priceCents: 5800
  },
  {
    id: 'builder',
    name: 'Builder Gel Overlay',
    description: 'Structured strengthening overlay for natural nails.',
    durationMinutes: 90,
    priceCents: 8200
  },
  {
    id: 'pedi',
    name: 'Spa Pedicure',
    description: 'Extended exfoliation, hydrating mask, and massage.',
    durationMinutes: 75,
    priceCents: 7000
  }
]

describe('filterBookingServices', () => {
  it('returns every service when the search query is blank', () => {
    expect(filterBookingServices(services, '   ')).toEqual(services)
  })

  it('filters services by name or description without changing their order', () => {
    expect(filterBookingServices(services, 'gel').map((service) => service.id)).toEqual(['gel', 'builder'])
    expect(filterBookingServices(services, 'massage').map((service) => service.id)).toEqual(['pedi'])
  })
})
