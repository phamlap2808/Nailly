import { describe, expect, it } from 'vitest'
import { buildStaffSavePayload } from '../utils/staff-payload'

const form = {
  name: 'Maya Chen',
  title: 'Lead Artist',
  bio: 'Calm detailed gel work.',
  active: true,
  commissionRateBps: 4500,
  serviceIds: ['gel', 'art']
}

describe('buildStaffSavePayload', () => {
  it('includes service assignments when they are editable', () => {
    expect(buildStaffSavePayload(form, { includeServiceIds: true })).toEqual(form)
  })

  it('omits service assignments when editing a staff row that did not load them', () => {
    expect(buildStaffSavePayload(form, { includeServiceIds: false })).toEqual({
      name: 'Maya Chen',
      title: 'Lead Artist',
      bio: 'Calm detailed gel work.',
      active: true,
      commissionRateBps: 4500
    })
  })
})
