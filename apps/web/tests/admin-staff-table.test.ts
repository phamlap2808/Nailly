import { describe, expect, it } from 'vitest'
import { filterStaffRows, getStaffServiceLabel, paginateStaffRows } from '../utils/admin-staff-table'

const staff = [
  {
    id: 'maya',
    name: 'Maya Chen',
    title: 'Lead Artist',
    bio: 'Detailed gel extensions and calm care.',
    active: true
  },
  {
    id: 'nora',
    name: 'Nora Lee',
    title: 'Pedicure Specialist',
    bio: 'Spa pedicure treatments.',
    active: false
  },
  {
    id: 'ivy',
    name: 'Ivy Tran',
    title: 'Nail Artist',
    bio: 'Minimal nail art.',
    active: true
  }
]

describe('admin staff table helpers', () => {
  it('filters staff by search text and status', () => {
    expect(filterStaffRows(staff, { searchQuery: 'gel', status: 'all' }).map((row) => row.id)).toEqual([
      'maya'
    ])

    expect(filterStaffRows(staff, { searchQuery: 'artist', status: 'active' }).map((row) => row.id)).toEqual([
      'maya',
      'ivy'
    ])

    expect(filterStaffRows(staff, { searchQuery: '', status: 'inactive' }).map((row) => row.id)).toEqual([
      'nora'
    ])
  })

  it('summarizes staff service coverage', () => {
    expect(getStaffServiceLabel({ staffServices: undefined })).toBe('All services')
    expect(getStaffServiceLabel({ staffServices: [] })).toBe('No services')
    expect(getStaffServiceLabel({ staffServices: [{ serviceId: 'gel' }] })).toBe('1 service')
    expect(getStaffServiceLabel({ staffServices: [{ serviceId: 'gel' }, { serviceId: 'art' }] })).toBe('2 services')
  })

  it('paginates staff rows and clamps the current page', () => {
    const firstPage = paginateStaffRows(staff, 1, 2)

    expect(firstPage.items.map((row) => row.id)).toEqual(['maya', 'nora'])
    expect(firstPage).toMatchObject({
      currentPage: 1,
      totalPages: 2,
      totalItems: 3,
      startItem: 1,
      endItem: 2
    })

    const lastPage = paginateStaffRows(staff, 9, 2)

    expect(lastPage.items.map((row) => row.id)).toEqual(['ivy'])
    expect(lastPage).toMatchObject({
      currentPage: 2,
      totalPages: 2,
      startItem: 3,
      endItem: 3
    })
  })
})
