import { describe, expect, it } from 'vitest'
import { formatPrice } from '../utils/format'

describe('public landing display helpers', () => {
  it('formats cents as USD for visible service prices', () => {
    expect(formatPrice(5200)).toBe('$52')
    expect(formatPrice(0)).toBe('$0')
  })
})
