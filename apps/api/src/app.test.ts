import { describe, expect, it } from 'vitest'

process.env.DATABASE_URL = 'postgres://nailly:nailly@postgres:5432/nailly'
process.env.REDIS_URL = 'redis://redis:6379'
process.env.CORS_ORIGIN = 'http://localhost:3000'
process.env.MINIO_ENDPOINT = 'minio'
process.env.MINIO_PORT = '9000'
process.env.MINIO_ACCESS_KEY = 'nailly'
process.env.MINIO_SECRET_KEY = 'nailly-password'
process.env.MINIO_BUCKET = 'nailly-media'
process.env.MINIO_PUBLIC_URL = 'http://localhost:9000/nailly-media'
process.env.AUTH_JWT_SECRET = 'a-very-long-local-secret-for-testing'

import { createApp } from './app'

describe('api foundation', () => {
  it('returns health status', async () => {
    const app = createApp()
    const response = await app.request('/health')

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({ ok: true, service: 'nailly-api' })
  })

  it('normalizes not found responses', async () => {
    const app = createApp()
    const response = await app.request('/missing')

    expect(response.status).toBe(404)
    await expect(response.json()).resolves.toEqual({
      error: {
        code: 'not_found',
        message: 'The requested resource was not found.'
      }
    })
  })
})
