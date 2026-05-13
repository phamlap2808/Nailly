import { describe, expect, it } from 'vitest'
import { formatPrice } from '../utils/format'

describe('formatPrice', () => {
  it('formats cents as USD for demo content', () => {
    expect(formatPrice(5200)).toBe('$52')
  })
})
