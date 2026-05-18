import { describe, expect, it } from 'vitest'
import { buildApiUrl, resolveRuntimeApiBaseUrl } from '../utils/api-url'

describe('buildApiUrl', () => {
  it('joins base URL and path without duplicate slashes', () => {
    expect(buildApiUrl('http://localhost:8787/', '/public/site')).toBe('http://localhost:8787/public/site')
  })

  it('uses the internal API URL for server rendering and the public URL in the browser', () => {
    const config = {
      apiBaseUrl: 'http://api:8787',
      public: {
        apiBaseUrl: 'http://localhost:8787'
      }
    }

    expect(resolveRuntimeApiBaseUrl(config, true)).toBe('http://api:8787')
    expect(resolveRuntimeApiBaseUrl(config, false)).toBe('http://localhost:8787')
  })
})
