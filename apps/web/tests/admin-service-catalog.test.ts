import { describe, expect, it } from 'vitest'
import { filterCatalogServices, paginateCatalogServices } from '../utils/admin-service-catalog'

const services = [
  {
    id: 'classic',
    name: 'Classic Manicure',
    description: 'Shape, cuticle care, massage, and polish.',
    active: true
  },
  {
    id: 'gel',
    name: 'Gel Manicure',
    description: 'Long-wear gel color with precise cuticle care.',
    active: false
  },
  {
    id: 'spa',
    name: 'Spa Pedicure',
    description: 'Extended exfoliation and massage.',
    active: true
  }
]

describe('admin service catalog helpers', () => {
  it('filters services by search text and status', () => {
    expect(filterCatalogServices(services, { searchQuery: 'GEL', status: 'all' }).map((service) => service.id)).toEqual([
      'gel'
    ])

    expect(filterCatalogServices(services, { searchQuery: 'massage', status: 'active' }).map((service) => service.id)).toEqual([
      'classic',
      'spa'
    ])

    expect(filterCatalogServices(services, { searchQuery: '', status: 'inactive' }).map((service) => service.id)).toEqual([
      'gel'
    ])
  })

  it('paginates services and clamps the current page', () => {
    const firstPage = paginateCatalogServices(services, 1, 2)

    expect(firstPage.items.map((service) => service.id)).toEqual(['classic', 'gel'])
    expect(firstPage).toMatchObject({
      currentPage: 1,
      totalPages: 2,
      totalItems: 3,
      startItem: 1,
      endItem: 2
    })

    const lastPage = paginateCatalogServices(services, 9, 2)

    expect(lastPage.items.map((service) => service.id)).toEqual(['spa'])
    expect(lastPage).toMatchObject({
      currentPage: 2,
      totalPages: 2,
      startItem: 3,
      endItem: 3
    })
  })
})
