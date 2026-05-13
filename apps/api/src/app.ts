import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { ApiError, errorResponse } from './http/errors'

export function createApp() {
  const app = new Hono()

  app.use(
    '*',
    cors({
      origin: process.env.CORS_ORIGIN ?? 'http://localhost:3000',
      credentials: true
    })
  )

  app.get('/health', (c) => c.json({ ok: true, service: 'nailly-api' }))

  app.notFound(() =>
    errorResponse(new ApiError(404, 'not_found', 'The requested resource was not found.'))
  )

  app.onError((error) => {
    if (error instanceof ApiError) {
      return errorResponse(error)
    }

    console.error(error)
    return errorResponse(new ApiError(500, 'internal_error', 'An unexpected error occurred.'))
  })

  return app
}
