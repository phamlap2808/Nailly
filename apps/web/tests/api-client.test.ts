import { describe, expect, it } from 'vitest'
import { buildApiUrl } from '../utils/api-url'

describe('buildApiUrl', () => {
  it('joins base URL and path without duplicate slashes', () => {
    expect(buildApiUrl('http://localhost:8787/', '/public/site')).toBe('http://localhost:8787/public/site')
  })
})
