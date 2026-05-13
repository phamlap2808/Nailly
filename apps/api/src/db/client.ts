import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { loadEnv } from '../config/env'
import * as schema from './schema'

export function createDb(databaseUrl = loadEnv().DATABASE_URL) {
  const client = postgres(databaseUrl, { max: 10 })
  return {
    client,
    db: drizzle(client, { schema })
  }
}
