import { describe, expect, it } from 'vitest'
import { formatTaxRate } from '../utils/admin-settings'

describe('admin settings helpers', () => {
  it('formats finance settings for tax and receipt defaults', () => {
    expect(formatTaxRate(825)).toBe('8.25%')
    expect(formatTaxRate(0)).toBe('0.00%')
  })
})
