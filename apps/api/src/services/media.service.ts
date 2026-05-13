import { ApiError } from '../http/errors'

const SUPPORTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const
const MAX_SIZE = 5_000_000 // 5MB

export function assertSupportedImage(input: {
  contentType: string
  sizeBytes: number
}): asserts input is { contentType: 'image/jpeg' | 'image/png' | 'image/webp'; sizeBytes: number } {
  if (!SUPPORTED_TYPES.includes(input.contentType as typeof SUPPORTED_TYPES[number])) {
    throw new ApiError(
      415,
      'unsupported_media_type',
      `Unsupported image type "${input.contentType}". Allowed: ${SUPPORTED_TYPES.join(', ')}.`
    )
  }

  if (input.sizeBytes > MAX_SIZE) {
    throw new ApiError(
      413,
      'payload_too_large',
      `Image size ${input.sizeBytes} exceeds the limit of ${MAX_SIZE} bytes.`
    )
  }
}
