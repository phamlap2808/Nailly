import { describe, expect, it } from 'vitest'
import { getBookingStatusDisplay } from '../utils/admin-status'

describe('getBookingStatusDisplay', () => {
  it('maps known booking statuses to warm editorial labels and class names', () => {
    expect(getBookingStatusDisplay('pending_confirmation')).toEqual({
      label: 'Pending',
      className: 'status-badge status-badge--pending'
    })
    expect(getBookingStatusDisplay('confirmed')).toEqual({
      label: 'Confirmed',
      className: 'status-badge status-badge--confirmed'
    })
    expect(getBookingStatusDisplay('completed')).toEqual({
      label: 'Completed',
      className: 'status-badge status-badge--completed'
    })
    expect(getBookingStatusDisplay('cancelled')).toEqual({
      label: 'Cancelled',
      className: 'status-badge status-badge--cancelled'
    })
  })

  it('formats unknown statuses without crashing layouts', () => {
    expect(getBookingStatusDisplay('needs_review')).toEqual({
      label: 'Needs review',
      className: 'status-badge'
    })
  })
})
