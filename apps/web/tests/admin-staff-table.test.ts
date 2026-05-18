import { describe, expect, it } from 'vitest'
import { formatCommissionRate } from '../utils/admin-staff-table'

const staffRows = [
  {
    id: 'staff-maya',
    name: 'Maya Chen',
    title: 'Senior Nail Artist',
    bio: 'Specializes in gel structure and soft neutral finishes.',
    active: true,
    commissionRateBps: 4500
  }
]

describe('admin staff table helpers', () => {
  it('keeps staff commission rate available for finance views', () => {
    expect(staffRows[0].commissionRateBps).toBe(4500)
  })

  it('formats staff commission rates for display', () => {
    expect(formatCommissionRate(staffRows[0].commissionRateBps)).toBe('45.00%')
  })
})
