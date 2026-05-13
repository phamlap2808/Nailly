import type { Context } from 'hono'
import type { StatusCode } from 'hono/utils/http-status'

export class ApiError extends Error {
  constructor(
    public readonly status: StatusCode,
    public readonly code: string,
    message: string,
    public readonly fields?: Record<string, string>
  ) {
    super(message)
  }
}

export function errorResponse(c: Context, error: ApiError): Response {
  return c.newResponse(
    JSON.stringify({
      error: {
        code: error.code,
        message: error.message,
        ...(error.fields ? { fields: error.fields } : {})
      }
    }),
    error.status,
    { 'Content-Type': 'application/json' }
  )
}
