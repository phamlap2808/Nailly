import { describe, expect, it } from 'vitest'
import { ApiError } from '../http/errors'
import { assertSupportedImage } from './media.service'

describe('assertSupportedImage', () => {
  it('accepts jpg, png, and webp files up to 5MB', () => {
    expect(() => assertSupportedImage({ contentType: 'image/jpeg', sizeBytes: 5_000_000 })).not.toThrow()
    expect(() => assertSupportedImage({ contentType: 'image/png', sizeBytes: 5_000_000 })).not.toThrow()
    expect(() => assertSupportedImage({ contentType: 'image/webp', sizeBytes: 5_000_000 })).not.toThrow()
  })

  it('rejects unsupported files', () => {
    expect(() => assertSupportedImage({ contentType: 'application/pdf', sizeBytes: 1200 })).toThrow(
      ApiError
    )
  })

  it('rejects files over 5MB', () => {
    expect(() => assertSupportedImage({ contentType: 'image/jpeg', sizeBytes: 5_000_001 })).toThrow(
      ApiError
    )
  })
})
