import { createApp } from './app'
import { loadEnv } from './config/env'

const env = loadEnv()

const server = Bun.serve({
  port: env.API_PORT,
  fetch: createApp().fetch
})

console.log(`Nailly API listening on http://localhost:${server.port}`)
