import { SignJWT, jwtVerify } from 'jose'
import type { Context } from 'hono'
import type { AdminPermission } from '@nailly/shared'
import { loadEnv } from '../config/env'

export interface AdminProfile {
  id: string
  email: string
  name: string
  role: string
  permissions?: AdminPermission[]
}

export async function signAdminToken(
  profile: Omit<AdminProfile, 'passwordHash'>,
  secret: string
): Promise<string> {
  return new SignJWT({ sub: profile.id, email: profile.email, name: profile.name, role: profile.role })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(new TextEncoder().encode(secret))
}

export async function verifyAdminToken(token: string, secret: string): Promise<AdminProfile> {
  const { payload } = await jwtVerify(token, new TextEncoder().encode(secret))
  return {
    id: payload.sub as string,
    email: payload.email as string,
    name: payload.name as string,
    role: payload.role as string
  }
}

export function setAdminCookie(c: Context, token: string) {
  const env = loadEnv()
  c.header(
    'Set-Cookie',
    `${env.AUTH_COOKIE_NAME}=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=86400`
  )
}

export function clearAdminCookie(c: Context) {
  const env = loadEnv()
  c.header(
    'Set-Cookie',
    `${env.AUTH_COOKIE_NAME}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0`
  )
}
