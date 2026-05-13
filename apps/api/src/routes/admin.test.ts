import { describe, expect, it } from 'vitest'
import { adminRoutes } from './admin'

describe('adminRoutes', () => {
  it('exposes an admin router factory', () => {
    expect(typeof adminRoutes).toBe('function')
  })
})
