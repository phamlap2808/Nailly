import { describe, expect, it } from 'vitest'
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
