import { eq } from 'drizzle-orm'
import { createDb } from '../db/client'
import { adminUsers } from '../db/schema'

export function createAdminUserRepository(databaseUrl?: string) {
  const { db } = createDb(databaseUrl)

  return {
    async findActiveByEmail(email: string) {
      const rows = await db
        .select()
        .from(adminUsers)
        .where(eq(adminUsers.email, email))
        .limit(1)

      return rows[0] ?? null
    }
  }
}
