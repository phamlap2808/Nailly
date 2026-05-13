import { z } from 'zod'

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  API_PORT: z.coerce.number().int().positive().default(8787),
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().min(1),
  CORS_ORIGIN: z.string().url(),
  MINIO_ENDPOINT: z.string().min(1),
  MINIO_PORT: z.coerce.number().int().positive(),
  MINIO_USE_SSL: z.preprocess(
    (v) => (v === 'true' || v === '1' ? true : v === 'false' || v === '0' ? false : v),
    z.boolean().default(false)
  ),
  MINIO_ACCESS_KEY: z.string().min(1),
  MINIO_SECRET_KEY: z.string().min(1),
  MINIO_BUCKET: z.string().min(1),
  MINIO_PUBLIC_URL: z.string().url(),
  AUTH_JWT_SECRET: z.string().min(24),
  AUTH_COOKIE_NAME: z.string().min(1).default('nailly_admin')
})

export type Env = z.infer<typeof envSchema>

export function loadEnv(input: NodeJS.ProcessEnv = process.env): Env {
  return envSchema.parse(input)
}
