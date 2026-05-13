import { describe, expect, it } from 'vitest'
import { canAccessRole } from './rbac'

describe('canAccessRole', () => {
  it('allows owners to access every admin capability', () => {
    expect(canAccessRole('owner', ['owner'])).toBe(true)
    expect(canAccessRole('owner', ['manager'])).toBe(true)
    expect(canAccessRole('owner', ['staff'])).toBe(true)
  })

  it('keeps staff out of manager and owner capabilities', () => {
    expect(canAccessRole('staff', ['staff'])).toBe(true)
    expect(canAccessRole('staff', ['manager'])).toBe(false)
    expect(canAccessRole('staff', ['owner'])).toBe(false)
  })
})
