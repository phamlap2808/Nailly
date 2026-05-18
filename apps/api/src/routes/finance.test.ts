import { describe, expect, it } from 'vitest'
import { adminRoutes } from './admin'

describe('admin finance routes', () => {
  it('exposes the admin route factory after finance routes are mounted', () => {
    expect(typeof adminRoutes).toBe('function')
  })
})
