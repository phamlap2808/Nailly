import { describe, expect, it } from 'vitest'
import {
  buildServiceHierarchy,
  getSelectedCategoryNode,
  getServicesForCategorySelection
} from '../utils/admin-service-hierarchy'

const categories = [
  { id: 'manicure', name: 'Manicures', description: 'Hands and polish care.', active: true },
  { id: 'pedicure', name: 'Pedicures', description: 'Foot care.', active: true },
  { id: 'art', name: 'Nail Art', description: 'Add-on details.', active: false }
]

const services = [
  { id: 'classic', categoryId: 'manicure', name: 'Classic Manicure', active: true },
  { id: 'gel', categoryId: 'manicure', name: 'Gel Manicure', active: false },
  { id: 'spa', categoryId: 'pedicure', name: 'Spa Pedicure', active: true }
]

describe('admin service hierarchy helpers', () => {
  it('builds an all-services node and category nodes with service counts', () => {
    const hierarchy = buildServiceHierarchy(categories, services)

    expect(hierarchy.all).toMatchObject({
      id: 'all',
      name: 'All services',
      serviceCount: 3,
      activeServiceCount: 2,
      inactiveServiceCount: 1
    })

    expect(hierarchy.categories.map((category) => ({
      id: category.id,
      serviceCount: category.serviceCount,
      activeServiceCount: category.activeServiceCount,
      inactiveServiceCount: category.inactiveServiceCount
    }))).toEqual([
      { id: 'manicure', serviceCount: 2, activeServiceCount: 1, inactiveServiceCount: 1 },
      { id: 'pedicure', serviceCount: 1, activeServiceCount: 1, inactiveServiceCount: 0 },
      { id: 'art', serviceCount: 0, activeServiceCount: 0, inactiveServiceCount: 0 }
    ])
  })

  it('returns the selected category node or falls back to all services', () => {
    const hierarchy = buildServiceHierarchy(categories, services)

    expect(getSelectedCategoryNode(hierarchy, 'pedicure')?.name).toBe('Pedicures')
    expect(getSelectedCategoryNode(hierarchy, 'missing')).toEqual(hierarchy.all)
  })

  it('returns services for all services or a selected category', () => {
    expect(getServicesForCategorySelection(services, 'all').map((service) => service.id)).toEqual([
      'classic',
      'gel',
      'spa'
    ])

    expect(getServicesForCategorySelection(services, 'manicure').map((service) => service.id)).toEqual([
      'classic',
      'gel'
    ])
  })
})
