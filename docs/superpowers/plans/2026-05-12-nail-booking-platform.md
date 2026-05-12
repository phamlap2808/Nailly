# Nail Booking Platform Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Dockerized full-stack MVP for a one-shop nail salon with an English landing page, public booking flow, role-based admin dashboard, PostgreSQL, Hono, Redis, MinIO, and Nuxt.

**Architecture:** Use a pnpm monorepo with `apps/api` for the Hono REST API, `apps/web` for the Nuxt app, and `packages/shared` for shared schemas/types. PostgreSQL remains the source of truth, Redis caches public site data, and MinIO stores uploaded media while the database stores media metadata. The host currently has Docker but not Node or pnpm, so all install/test/build commands should run through Docker Compose services.

**Tech Stack:** TypeScript, pnpm workspaces, Nuxt 3, Nuxt UI, Pinia, i18n, SEO/Image/Icon/Fonts modules, Hono, Zod, Drizzle ORM, PostgreSQL, Redis, MinIO, Vitest, Docker Compose.

---

## Scope Notes

- Build for one shop only. Do not add branches or branch selection.
- Build English-first UI with i18n structure ready for Vietnamese later.
- Public customers do not create accounts.
- Booking status after public submit is `pending_confirmation`.
- Do not add online payment.
- Use professional demo salon content until real shop information is provided.

## File Structure Map

Create or modify these paths:

- `package.json`: root scripts and workspace metadata.
- `pnpm-workspace.yaml`: monorepo package discovery.
- `tsconfig.base.json`: shared TypeScript defaults.
- `.env.example`: documented local environment values.
- `.dockerignore`: Docker build context exclusions.
- `docker-compose.yml`: PostgreSQL, Redis, MinIO, API, web, and tooling services.
- `packages/shared/package.json`: shared package scripts/dependencies.
- `packages/shared/src/schemas.ts`: domain enums and Zod schemas.
- `packages/shared/src/index.ts`: public shared exports.
- `packages/shared/src/schemas.test.ts`: schema behavior tests.
- `apps/api/package.json`: Hono API scripts/dependencies.
- `apps/api/tsconfig.json`: API TypeScript config.
- `apps/api/drizzle.config.ts`: Drizzle configuration.
- `apps/api/vitest.config.ts`: API test config.
- `apps/api/src/app.ts`: Hono app factory and route mounting.
- `apps/api/src/server.ts`: API server entrypoint.
- `apps/api/src/config/env.ts`: environment parsing.
- `apps/api/src/http/errors.ts`: normalized API errors.
- `apps/api/src/http/auth.ts`: auth cookie/JWT helpers.
- `apps/api/src/http/rbac.ts`: role checks.
- `apps/api/src/db/schema.ts`: PostgreSQL schema.
- `apps/api/src/db/client.ts`: Drizzle/Postgres client.
- `apps/api/src/db/seed-data.ts`: deterministic seed records.
- `apps/api/src/db/seed.ts`: database seed runner.
- `apps/api/src/cache/redis.ts`: Redis client/cache wrapper.
- `apps/api/src/storage/minio.ts`: MinIO client/upload wrapper.
- `apps/api/src/repositories/*.ts`: database access units.
- `apps/api/src/services/*.ts`: business rules for site, availability, booking, auth, media.
- `apps/api/src/routes/*.ts`: public, auth, admin, and media routes.
- `apps/api/src/**/*.test.ts`: API tests.
- `apps/web/package.json`: Nuxt app scripts/dependencies.
- `apps/web/nuxt.config.ts`: Nuxt module configuration.
- `apps/web/app.vue`: app shell.
- `apps/web/assets/css/main.css`: global CSS tokens and layout polish.
- `apps/web/i18n/locales/en.json`: English UI strings.
- `apps/web/plugins/api.ts`: typed API client helper.
- `apps/web/stores/session.ts`: admin session state.
- `apps/web/middleware/admin-auth.ts`: protected admin routes.
- `apps/web/pages/index.vue`: landing page.
- `apps/web/pages/booking.vue`: public booking page.
- `apps/web/pages/admin/login.vue`: admin login.
- `apps/web/pages/admin/index.vue`: admin overview.
- `apps/web/pages/admin/bookings.vue`: booking management.
- `apps/web/pages/admin/services.vue`: service management.
- `apps/web/pages/admin/staff.vue`: staff management.
- `apps/web/pages/admin/media.vue`: media management.
- `apps/web/pages/admin/settings.vue`: shop settings.
- `apps/web/components/*`: focused UI components used by pages.
- `apps/web/tests/*.test.ts`: frontend smoke and interaction tests.
- `README.md`: local setup and verification commands.

## Command Conventions

Before `docker-compose.yml` exists, use:

```bash
docker run --rm -v "$PWD":/workspace -w /workspace node:22-bookworm bash -lc "corepack enable && pnpm --version"
```

After Task 1, use Docker Compose:

```bash
docker compose run --rm tooling pnpm install
docker compose run --rm tooling pnpm --filter @nailly/shared test
docker compose run --rm tooling pnpm --filter @nailly/api test
docker compose run --rm tooling pnpm --filter @nailly/web test
```

---

### Task 1: Dockerized Monorepo Baseline

**Files:**
- Create: `package.json`
- Create: `pnpm-workspace.yaml`
- Create: `tsconfig.base.json`
- Create: `.env.example`
- Create: `.dockerignore`
- Create: `docker-compose.yml`
- Modify: `.gitignore`

- [ ] **Step 1: Create root package metadata**

Create `package.json`:

```json
{
  "name": "nailly",
  "private": true,
  "packageManager": "pnpm@10.11.0",
  "scripts": {
    "dev": "docker compose up --build",
    "install:docker": "docker compose run --rm tooling pnpm install",
    "test": "docker compose run --rm tooling pnpm -r test",
    "lint": "docker compose run --rm tooling pnpm -r lint",
    "build": "docker compose run --rm tooling pnpm -r build",
    "db:push": "docker compose run --rm tooling pnpm --filter @nailly/api db:push",
    "db:seed": "docker compose run --rm tooling pnpm --filter @nailly/api db:seed"
  }
}
```

- [ ] **Step 2: Create workspace config**

Create `pnpm-workspace.yaml`:

```yaml
packages:
  - apps/*
  - packages/*
```

Create `tsconfig.base.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "skipLibCheck": true,
    "allowSyntheticDefaultImports": true,
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "types": ["node"],
    "baseUrl": ".",
    "paths": {
      "@nailly/shared": ["packages/shared/src/index.ts"]
    }
  }
}
```

- [ ] **Step 3: Create environment documentation**

Create `.env.example`:

```bash
NODE_ENV=development
API_PORT=8787
WEB_PORT=3000
PUBLIC_API_BASE_URL=http://localhost:8787
CORS_ORIGIN=http://localhost:3000

DATABASE_URL=postgres://nailly:nailly@postgres:5432/nailly
REDIS_URL=redis://redis:6379

MINIO_ENDPOINT=minio
MINIO_PORT=9000
MINIO_USE_SSL=false
MINIO_ACCESS_KEY=nailly
MINIO_SECRET_KEY=nailly-password
MINIO_BUCKET=nailly-media
MINIO_PUBLIC_URL=http://localhost:9000/nailly-media

AUTH_JWT_SECRET=replace-this-with-a-long-local-secret
AUTH_COOKIE_NAME=nailly_admin
```

- [ ] **Step 4: Add Docker exclusions and ignored local artifacts**

Create `.dockerignore`:

```gitignore
.git
.superpowers
node_modules
**/node_modules
.nuxt
.output
dist
coverage
.env
```

Ensure `.gitignore` contains:

```gitignore
.superpowers/
node_modules/
.nuxt/
.output/
dist/
coverage/
.env
```

- [ ] **Step 5: Create Docker Compose services**

Create `docker-compose.yml`:

```yaml
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: nailly
      POSTGRES_PASSWORD: nailly
      POSTGRES_DB: nailly
    ports:
      - "5432:5432"
    volumes:
      - postgres-data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U nailly -d nailly"]
      interval: 5s
      timeout: 5s
      retries: 20

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 5s
      retries: 20

  minio:
    image: minio/minio:RELEASE.2025-04-22T22-12-26Z
    command: server /data --console-address ":9001"
    environment:
      MINIO_ROOT_USER: nailly
      MINIO_ROOT_PASSWORD: nailly-password
    ports:
      - "9000:9000"
      - "9001:9001"
    volumes:
      - minio-data:/data

  minio-init:
    image: minio/mc:RELEASE.2025-04-16T18-13-26Z
    depends_on:
      - minio
    entrypoint: >
      /bin/sh -c "
      until mc alias set local http://minio:9000 nailly nailly-password; do sleep 2; done;
      mc mb -p local/nailly-media || true;
      mc anonymous set download local/nailly-media;
      "

  tooling:
    image: node:22-bookworm
    working_dir: /workspace
    env_file:
      - .env
    volumes:
      - .:/workspace
      - pnpm-store:/root/.local/share/pnpm/store
    command: bash -lc "corepack enable && pnpm --version"

  api:
    image: node:22-bookworm
    working_dir: /workspace
    env_file:
      - .env
    volumes:
      - .:/workspace
      - pnpm-store:/root/.local/share/pnpm/store
    ports:
      - "8787:8787"
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
      minio-init:
        condition: service_completed_successfully
    command: bash -lc "corepack enable && pnpm install && pnpm --filter @nailly/api dev"

  web:
    image: node:22-bookworm
    working_dir: /workspace
    env_file:
      - .env
    volumes:
      - .:/workspace
      - pnpm-store:/root/.local/share/pnpm/store
    ports:
      - "3000:3000"
    depends_on:
      - api
    command: bash -lc "corepack enable && pnpm install && pnpm --filter @nailly/web dev --host 0.0.0.0 --port 3000"

volumes:
  postgres-data:
  minio-data:
  pnpm-store:
```

- [ ] **Step 6: Verify Compose parses**

Run:

```bash
cp .env.example .env
docker compose config
```

Expected: command exits with code `0` and prints the expanded service configuration.

- [ ] **Step 7: Commit**

```bash
git add package.json pnpm-workspace.yaml tsconfig.base.json .env.example .dockerignore docker-compose.yml .gitignore
git commit -m "chore: add dockerized monorepo baseline"
```

---

### Task 2: Shared Domain Schemas

**Files:**
- Create: `packages/shared/package.json`
- Create: `packages/shared/tsconfig.json`
- Create: `packages/shared/vitest.config.ts`
- Create: `packages/shared/src/schemas.test.ts`
- Create: `packages/shared/src/schemas.ts`
- Create: `packages/shared/src/index.ts`

- [ ] **Step 1: Create shared package metadata**

Create `packages/shared/package.json`:

```json
{
  "name": "@nailly/shared",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "main": "./src/index.ts",
  "scripts": {
    "test": "vitest run",
    "lint": "tsc --noEmit",
    "build": "tsc --noEmit"
  },
  "dependencies": {
    "zod": "^3.25.0"
  },
  "devDependencies": {
    "@types/node": "^22.15.0",
    "typescript": "^5.8.0",
    "vitest": "^3.1.0"
  }
}
```

Create `packages/shared/tsconfig.json`:

```json
{
  "extends": "../../tsconfig.base.json",
  "include": ["src/**/*.ts"]
}
```

Create `packages/shared/vitest.config.ts`:

```ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: false,
    environment: 'node'
  }
})
```

- [ ] **Step 2: Write failing schema tests**

Create `packages/shared/src/schemas.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import {
  adminRoleSchema,
  bookingStatusSchema,
  createBookingSchema,
  publicAvailabilityQuerySchema
} from './schemas'

describe('shared schemas', () => {
  it('accepts only supported admin roles', () => {
    expect(adminRoleSchema.parse('owner')).toBe('owner')
    expect(adminRoleSchema.safeParse('customer').success).toBe(false)
  })

  it('keeps public bookings in the pending confirmation workflow', () => {
    expect(bookingStatusSchema.parse('pending_confirmation')).toBe('pending_confirmation')
    expect(bookingStatusSchema.safeParse('draft').success).toBe(false)
  })

  it('validates a public booking request without requiring a customer account', () => {
    const parsed = createBookingSchema.parse({
      customerName: 'Avery Stone',
      phone: '+1 555 0100',
      email: 'avery@example.com',
      partySize: 2,
      serviceIds: ['svc-gel-manicure'],
      staffId: 'staff-maya',
      appointmentDate: '2026-06-03',
      startTime: '10:30',
      note: 'Prefers a quiet technician'
    })

    expect(parsed.status).toBe('pending_confirmation')
  })

  it('validates availability queries with ISO date and service IDs', () => {
    const parsed = publicAvailabilityQuerySchema.parse({
      date: '2026-06-03',
      serviceIds: ['svc-gel-manicure', 'svc-nail-art']
    })

    expect(parsed.serviceIds).toHaveLength(2)
  })
})
```

- [ ] **Step 3: Run test to verify it fails**

Run:

```bash
docker compose run --rm tooling pnpm install
docker compose run --rm tooling pnpm --filter @nailly/shared test
```

Expected: FAIL because `packages/shared/src/schemas.ts` does not exist.

- [ ] **Step 4: Implement shared schemas**

Create `packages/shared/src/schemas.ts`:

```ts
import { z } from 'zod'

export const adminRoleValues = ['owner', 'manager', 'staff'] as const
export const adminRoleSchema = z.enum(adminRoleValues)
export type AdminRole = z.infer<typeof adminRoleSchema>

export const bookingStatusValues = [
  'pending_confirmation',
  'confirmed',
  'cancelled',
  'completed',
  'no_show'
] as const
export const bookingStatusSchema = z.enum(bookingStatusValues)
export type BookingStatus = z.infer<typeof bookingStatusSchema>

export const isoDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD')
export const timeSlotSchema = z.string().regex(/^\d{2}:\d{2}$/, 'Use HH:mm')

export const serviceSchema = z.object({
  id: z.string().min(1),
  categoryId: z.string().min(1),
  name: z.string().min(1),
  description: z.string().min(1),
  durationMinutes: z.number().int().min(15).max(480),
  priceCents: z.number().int().min(0),
  active: z.boolean(),
  imageUrl: z.string().url().nullable()
})
export type Service = z.infer<typeof serviceSchema>

export const staffSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  title: z.string().min(1),
  bio: z.string().min(1),
  active: z.boolean(),
  imageUrl: z.string().url().nullable()
})
export type Staff = z.infer<typeof staffSchema>

export const createBookingSchema = z
  .object({
    customerName: z.string().trim().min(2).max(120),
    phone: z.string().trim().min(7).max(30),
    email: z.string().trim().email().optional().or(z.literal('')),
    partySize: z.number().int().min(1).max(8).default(1),
    serviceIds: z.array(z.string().min(1)).min(1),
    staffId: z.string().min(1).optional().nullable(),
    appointmentDate: isoDateSchema,
    startTime: timeSlotSchema,
    note: z.string().trim().max(1000).optional().or(z.literal('')),
    status: bookingStatusSchema.default('pending_confirmation')
  })
  .transform((value) => ({
    ...value,
    email: value.email === '' ? undefined : value.email,
    note: value.note === '' ? undefined : value.note,
    status: 'pending_confirmation' as const
  }))
export type CreateBookingInput = z.input<typeof createBookingSchema>
export type CreateBooking = z.output<typeof createBookingSchema>

export const publicAvailabilityQuerySchema = z.object({
  date: isoDateSchema,
  serviceIds: z
    .union([z.array(z.string().min(1)), z.string().min(1)])
    .transform((value) => (Array.isArray(value) ? value : value.split(',').filter(Boolean))),
  staffId: z.string().min(1).optional()
})
export type PublicAvailabilityQuery = z.output<typeof publicAvailabilityQuerySchema>

export const apiErrorSchema = z.object({
  code: z.string(),
  message: z.string(),
  fields: z.record(z.string()).optional()
})
export type ApiError = z.infer<typeof apiErrorSchema>
```

Create `packages/shared/src/index.ts`:

```ts
export * from './schemas'
```

- [ ] **Step 5: Run test to verify it passes**

Run:

```bash
docker compose run --rm tooling pnpm --filter @nailly/shared test
docker compose run --rm tooling pnpm --filter @nailly/shared lint
```

Expected: PASS for tests and `tsc --noEmit`.

- [ ] **Step 6: Commit**

```bash
git add packages/shared
git commit -m "feat: add shared booking schemas"
```

---

### Task 3: Hono API Foundation

**Files:**
- Create: `apps/api/package.json`
- Create: `apps/api/tsconfig.json`
- Create: `apps/api/vitest.config.ts`
- Create: `apps/api/src/app.test.ts`
- Create: `apps/api/src/config/env.ts`
- Create: `apps/api/src/http/errors.ts`
- Create: `apps/api/src/app.ts`
- Create: `apps/api/src/server.ts`

- [ ] **Step 1: Create API package metadata**

Create `apps/api/package.json`:

```json
{
  "name": "@nailly/api",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "tsx watch src/server.ts",
    "start": "node dist/server.js",
    "test": "vitest run",
    "lint": "tsc --noEmit",
    "build": "tsc --outDir dist",
    "db:push": "drizzle-kit push",
    "db:seed": "tsx src/db/seed.ts"
  },
  "dependencies": {
    "@hono/zod-validator": "^0.5.0",
    "@nailly/shared": "workspace:*",
    "@minio/minio": "^8.0.0",
    "bcryptjs": "^3.0.0",
    "drizzle-orm": "^0.43.0",
    "hono": "^4.7.0",
    "ioredis": "^5.6.0",
    "jose": "^6.0.0",
    "postgres": "^3.4.0",
    "zod": "^3.25.0"
  },
  "devDependencies": {
    "@types/node": "^22.15.0",
    "drizzle-kit": "^0.31.0",
    "tsx": "^4.19.0",
    "typescript": "^5.8.0",
    "vitest": "^3.1.0"
  }
}
```

Create `apps/api/tsconfig.json`:

```json
{
  "extends": "../../tsconfig.base.json",
  "include": ["src/**/*.ts", "drizzle.config.ts"]
}
```

Create `apps/api/vitest.config.ts`:

```ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: false,
    environment: 'node'
  }
})
```

- [ ] **Step 2: Write failing API foundation tests**

Create `apps/api/src/app.test.ts`:

```ts
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
```

- [ ] **Step 3: Run test to verify it fails**

Run:

```bash
docker compose run --rm tooling pnpm install
docker compose run --rm tooling pnpm --filter @nailly/api test
```

Expected: FAIL because `apps/api/src/app.ts` does not exist.

- [ ] **Step 4: Implement API app factory and errors**

Create `apps/api/src/config/env.ts`:

```ts
import { z } from 'zod'

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  API_PORT: z.coerce.number().int().positive().default(8787),
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().min(1),
  CORS_ORIGIN: z.string().url(),
  MINIO_ENDPOINT: z.string().min(1),
  MINIO_PORT: z.coerce.number().int().positive(),
  MINIO_USE_SSL: z.coerce.boolean().default(false),
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
```

Create `apps/api/src/http/errors.ts`:

```ts
import type { Context } from 'hono'

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly fields?: Record<string, string>
  ) {
    super(message)
  }
}

export function errorResponse(c: Context, error: ApiError) {
  return c.json(
    {
      error: {
        code: error.code,
        message: error.message,
        ...(error.fields ? { fields: error.fields } : {})
      }
    },
    error.status
  )
}
```

Create `apps/api/src/app.ts`:

```ts
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

  app.notFound((c) =>
    errorResponse(c, new ApiError(404, 'not_found', 'The requested resource was not found.'))
  )

  app.onError((error, c) => {
    if (error instanceof ApiError) {
      return errorResponse(c, error)
    }

    console.error(error)
    return errorResponse(c, new ApiError(500, 'internal_error', 'An unexpected error occurred.'))
  })

  return app
}
```

Create `apps/api/src/server.ts`:

```ts
import { serve } from '@hono/node-server'
import { createApp } from './app'
import { loadEnv } from './config/env'

const env = loadEnv()

serve({
  fetch: createApp().fetch,
  port: env.API_PORT
})

console.log(`Nailly API listening on http://localhost:${env.API_PORT}`)
```

Add `@hono/node-server` to `apps/api/package.json` dependencies:

```json
"@hono/node-server": "^1.14.0"
```

- [ ] **Step 5: Run test to verify it passes**

Run:

```bash
docker compose run --rm tooling pnpm install
docker compose run --rm tooling pnpm --filter @nailly/api test
docker compose run --rm tooling pnpm --filter @nailly/api lint
```

Expected: PASS for tests and `tsc --noEmit`.

- [ ] **Step 6: Commit**

```bash
git add apps/api
git commit -m "feat: add hono api foundation"
```

---

### Task 4: Database Schema and Seed Data

**Files:**
- Create: `apps/api/drizzle.config.ts`
- Create: `apps/api/src/db/schema.ts`
- Create: `apps/api/src/db/seed-data.test.ts`
- Create: `apps/api/src/db/seed-data.ts`
- Create: `apps/api/src/db/client.ts`
- Create: `apps/api/src/db/seed.ts`

- [ ] **Step 1: Write failing seed data tests**

Create `apps/api/src/db/seed-data.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { demoSeed } from './seed-data'

describe('demo seed data', () => {
  it('creates one shop with English public content', () => {
    expect(demoSeed.shop.name).toBe('Luma Nail Studio')
    expect(demoSeed.shop.locale).toBe('en')
    expect(demoSeed.shop.address).toContain('Main Street')
  })

  it('includes nail services, staff, gallery, and role-based admins', () => {
    expect(demoSeed.categories.length).toBeGreaterThanOrEqual(3)
    expect(demoSeed.services.length).toBeGreaterThanOrEqual(6)
    expect(demoSeed.staff.length).toBeGreaterThanOrEqual(3)
    expect(demoSeed.media.length).toBeGreaterThanOrEqual(4)
    expect(demoSeed.adminUsers.map((user) => user.role).sort()).toEqual(['manager', 'owner', 'staff'])
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
docker compose run --rm tooling pnpm --filter @nailly/api test src/db/seed-data.test.ts
```

Expected: FAIL because `seed-data.ts` does not exist.

- [ ] **Step 3: Add Drizzle config**

Create `apps/api/drizzle.config.ts`:

```ts
import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL ?? 'postgres://nailly:nailly@postgres:5432/nailly'
  }
})
```

- [ ] **Step 4: Implement database schema**

Create `apps/api/src/db/schema.ts`:

```ts
import { relations } from 'drizzle-orm'
import {
  boolean,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid
} from 'drizzle-orm/pg-core'

export const adminRole = pgEnum('admin_role', ['owner', 'manager', 'staff'])
export const bookingStatus = pgEnum('booking_status', [
  'pending_confirmation',
  'confirmed',
  'cancelled',
  'completed',
  'no_show'
])

export const shopSettings = pgTable('shop_settings', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  locale: text('locale').notNull().default('en'),
  tagline: text('tagline').notNull(),
  description: text('description').notNull(),
  phone: text('phone').notNull(),
  email: text('email'),
  address: text('address').notNull(),
  mapUrl: text('map_url'),
  openingHours: jsonb('opening_hours').$type<Record<string, string>>().notNull(),
  seoTitle: text('seo_title').notNull(),
  seoDescription: text('seo_description').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
})

export const mediaAssets = pgTable('media_assets', {
  id: uuid('id').primaryKey().defaultRandom(),
  objectKey: text('object_key').notNull().unique(),
  publicUrl: text('public_url').notNull(),
  contentType: text('content_type').notNull(),
  sizeBytes: integer('size_bytes').notNull(),
  altText: text('alt_text').notNull(),
  usageType: text('usage_type').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
})

export const serviceCategories = pgTable('service_categories', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  description: text('description').notNull(),
  sortOrder: integer('sort_order').notNull().default(0),
  active: boolean('active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
})

export const services = pgTable('services', {
  id: uuid('id').primaryKey().defaultRandom(),
  categoryId: uuid('category_id').references(() => serviceCategories.id).notNull(),
  imageId: uuid('image_id').references(() => mediaAssets.id),
  name: text('name').notNull(),
  description: text('description').notNull(),
  durationMinutes: integer('duration_minutes').notNull(),
  priceCents: integer('price_cents').notNull(),
  sortOrder: integer('sort_order').notNull().default(0),
  active: boolean('active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
})

export const staff = pgTable('staff', {
  id: uuid('id').primaryKey().defaultRandom(),
  imageId: uuid('image_id').references(() => mediaAssets.id),
  name: text('name').notNull(),
  title: text('title').notNull(),
  bio: text('bio').notNull(),
  active: boolean('active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
})

export const staffServices = pgTable(
  'staff_services',
  {
    staffId: uuid('staff_id').references(() => staff.id).notNull(),
    serviceId: uuid('service_id').references(() => services.id).notNull()
  },
  (table) => ({
    pk: primaryKey({ columns: [table.staffId, table.serviceId] })
  })
)

export const availabilityRules = pgTable('availability_rules', {
  id: uuid('id').primaryKey().defaultRandom(),
  staffId: uuid('staff_id').references(() => staff.id),
  dayOfWeek: integer('day_of_week').notNull(),
  startTime: text('start_time').notNull(),
  endTime: text('end_time').notNull(),
  active: boolean('active').notNull().default(true)
})

export const bookings = pgTable(
  'bookings',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    staffId: uuid('staff_id').references(() => staff.id),
    customerName: text('customer_name').notNull(),
    phone: text('phone').notNull(),
    email: text('email'),
    partySize: integer('party_size').notNull().default(1),
    appointmentDate: text('appointment_date').notNull(),
    startTime: text('start_time').notNull(),
    endTime: text('end_time').notNull(),
    status: bookingStatus('status').notNull().default('pending_confirmation'),
    note: text('note'),
    source: text('source').notNull().default('public_web'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => ({
    slotIdx: uniqueIndex('bookings_staff_date_time_unique').on(
      table.staffId,
      table.appointmentDate,
      table.startTime
    )
  })
)

export const bookingServices = pgTable(
  'booking_services',
  {
    bookingId: uuid('booking_id').references(() => bookings.id).notNull(),
    serviceId: uuid('service_id').references(() => services.id).notNull()
  },
  (table) => ({
    pk: primaryKey({ columns: [table.bookingId, table.serviceId] })
  })
)

export const adminUsers = pgTable('admin_users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  name: text('name').notNull(),
  role: adminRole('role').notNull(),
  active: boolean('active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
})

export const serviceRelations = relations(services, ({ one, many }) => ({
  category: one(serviceCategories, {
    fields: [services.categoryId],
    references: [serviceCategories.id]
  }),
  image: one(mediaAssets, {
    fields: [services.imageId],
    references: [mediaAssets.id]
  }),
  staffServices: many(staffServices)
}))
```

- [ ] **Step 5: Implement deterministic seed data**

Create `apps/api/src/db/seed-data.ts` with exported `demoSeed` containing this shape:

```ts
import type { AdminRole } from '@nailly/shared'

export const demoSeed = {
  shop: {
    name: 'Luma Nail Studio',
    locale: 'en',
    tagline: 'Modern nail care with calm, careful detail.',
    description:
      'A one-shop nail studio offering manicures, pedicures, gel care, nail art, and restorative treatments.',
    phone: '+1 555 0134',
    email: 'hello@lumanails.example',
    address: '128 Main Street, Suite 4, San Jose, CA',
    mapUrl: 'https://maps.example.com/luma-nail-studio',
    openingHours: {
      monday: '09:00 - 19:30',
      tuesday: '09:00 - 19:30',
      wednesday: '09:00 - 19:30',
      thursday: '09:00 - 19:30',
      friday: '09:00 - 19:30',
      saturday: '09:00 - 18:00',
      sunday: 'Closed'
    },
    seoTitle: 'Luma Nail Studio | Nail Appointments',
    seoDescription: 'Book manicures, pedicures, gel nails, and nail art at Luma Nail Studio.'
  },
  media: [
    {
      key: 'demo/gallery-soft-pink-manicure.jpg',
      publicUrl: 'http://localhost:9000/nailly-media/demo/gallery-soft-pink-manicure.jpg',
      contentType: 'image/jpeg',
      sizeBytes: 118000,
      altText: 'Soft pink gel manicure',
      usageType: 'gallery'
    },
    {
      key: 'demo/gallery-minimal-nail-art.jpg',
      publicUrl: 'http://localhost:9000/nailly-media/demo/gallery-minimal-nail-art.jpg',
      contentType: 'image/jpeg',
      sizeBytes: 124000,
      altText: 'Minimal line nail art',
      usageType: 'gallery'
    },
    {
      key: 'demo/service-gel-manicure.jpg',
      publicUrl: 'http://localhost:9000/nailly-media/demo/service-gel-manicure.jpg',
      contentType: 'image/jpeg',
      sizeBytes: 103000,
      altText: 'Gel manicure service',
      usageType: 'service'
    },
    {
      key: 'demo/staff-maya.jpg',
      publicUrl: 'http://localhost:9000/nailly-media/demo/staff-maya.jpg',
      contentType: 'image/jpeg',
      sizeBytes: 98000,
      altText: 'Maya, senior nail artist',
      usageType: 'staff'
    }
  ],
  categories: [
    { name: 'Manicures', description: 'Classic and gel manicure care.', sortOrder: 1 },
    { name: 'Pedicures', description: 'Relaxing foot care and polish.', sortOrder: 2 },
    { name: 'Nail Art', description: 'Detailed accents and custom designs.', sortOrder: 3 }
  ],
  services: [
    { categoryName: 'Manicures', name: 'Classic Manicure', description: 'Shape, cuticle care, massage, and polish.', durationMinutes: 45, priceCents: 3500, sortOrder: 1 },
    { categoryName: 'Manicures', name: 'Gel Manicure', description: 'Long-wear gel color with precise cuticle care.', durationMinutes: 60, priceCents: 5200, sortOrder: 2 },
    { categoryName: 'Manicures', name: 'Builder Gel Overlay', description: 'Strengthening overlay for natural nails.', durationMinutes: 90, priceCents: 7800, sortOrder: 3 },
    { categoryName: 'Pedicures', name: 'Classic Pedicure', description: 'Foot soak, nail care, massage, and polish.', durationMinutes: 60, priceCents: 4800, sortOrder: 4 },
    { categoryName: 'Pedicures', name: 'Spa Pedicure', description: 'Extended exfoliation, mask, massage, and polish.', durationMinutes: 75, priceCents: 6500, sortOrder: 5 },
    { categoryName: 'Nail Art', name: 'Minimal Nail Art', description: 'Simple accents on up to four nails.', durationMinutes: 30, priceCents: 2200, sortOrder: 6 }
  ],
  staff: [
    { name: 'Maya Chen', title: 'Senior Nail Artist', bio: 'Specializes in gel structure and soft neutral finishes.' },
    { name: 'Ari Morgan', title: 'Nail Artist', bio: 'Known for clean manicures and playful minimal art.' },
    { name: 'Nina Patel', title: 'Pedicure Specialist', bio: 'Focuses on restorative foot care and calm service.' }
  ],
  adminUsers: [
    { email: 'owner@lumanails.example', password: 'owner-password', name: 'Owner Demo', role: 'owner' as AdminRole },
    { email: 'manager@lumanails.example', password: 'manager-password', name: 'Manager Demo', role: 'manager' as AdminRole },
    { email: 'staff@lumanails.example', password: 'staff-password', name: 'Staff Demo', role: 'staff' as AdminRole }
  ]
}
```

- [ ] **Step 6: Add DB client and seed runner**

Create `apps/api/src/db/client.ts`:

```ts
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
```

Create `apps/api/src/db/seed.ts` that connects with `createDb()`, creates the MinIO bucket if needed, uploads deterministic demo image objects for every `demoSeed.media` item, clears tables in dependency order, inserts `demoSeed`, hashes admin passwords with `bcryptjs.hash(password, 10)`, creates weekly `availabilityRules` from 09:00 to 19:30 for weekdays and 09:00 to 18:00 for Saturday, maps all demo staff to all services, logs inserted counts, and closes the Postgres client.

Use this 1x1 PNG buffer for demo media objects so seeded public images resolve locally:

```ts
const demoPng = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=',
  'base64'
)
```

- [ ] **Step 7: Run tests and push schema**

Run:

```bash
docker compose up -d postgres redis minio minio-init
docker compose run --rm tooling pnpm --filter @nailly/api test src/db/seed-data.test.ts
docker compose run --rm tooling pnpm --filter @nailly/api db:push
docker compose run --rm tooling pnpm --filter @nailly/api db:seed
```

Expected: tests PASS, Drizzle push succeeds, seed logs one shop, six services, three staff, and three admin users.

- [ ] **Step 8: Commit**

```bash
git add apps/api/drizzle.config.ts apps/api/src/db
git commit -m "feat: add database schema and demo seed"
```

---

### Task 5: Public Site API with Redis Cache

**Files:**
- Create: `apps/api/src/cache/redis.ts`
- Create: `apps/api/src/repositories/public-site.repository.ts`
- Create: `apps/api/src/services/public-site.service.test.ts`
- Create: `apps/api/src/services/public-site.service.ts`
- Create: `apps/api/src/routes/public.ts`
- Modify: `apps/api/src/app.ts`

- [ ] **Step 1: Write failing service tests**

Create `apps/api/src/services/public-site.service.test.ts`:

```ts
import { describe, expect, it, vi } from 'vitest'
import { PublicSiteService } from './public-site.service'

describe('PublicSiteService', () => {
  it('returns cached public site payload when available', async () => {
    const cache = {
      getJson: vi.fn().mockResolvedValue({ shop: { name: 'Cached Studio' } }),
      setJson: vi.fn()
    }
    const repository = { getPublicSite: vi.fn() }

    const service = new PublicSiteService(repository, cache)
    const result = await service.getPublicSite()

    expect(result.shop.name).toBe('Cached Studio')
    expect(repository.getPublicSite).not.toHaveBeenCalled()
  })

  it('loads from repository and caches on miss', async () => {
    const payload = { shop: { name: 'Luma Nail Studio' }, services: [], staff: [], gallery: [] }
    const cache = {
      getJson: vi.fn().mockResolvedValue(null),
      setJson: vi.fn().mockResolvedValue(undefined)
    }
    const repository = { getPublicSite: vi.fn().mockResolvedValue(payload) }

    const service = new PublicSiteService(repository, cache)
    const result = await service.getPublicSite()

    expect(result).toEqual(payload)
    expect(cache.setJson).toHaveBeenCalledWith('public:site', payload, 300)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
docker compose run --rm tooling pnpm --filter @nailly/api test src/services/public-site.service.test.ts
```

Expected: FAIL because `public-site.service.ts` does not exist.

- [ ] **Step 3: Implement Redis wrapper**

Create `apps/api/src/cache/redis.ts`:

```ts
import Redis from 'ioredis'
import { loadEnv } from '../config/env'

export interface JsonCache {
  getJson<T>(key: string): Promise<T | null>
  setJson<T>(key: string, value: T, ttlSeconds: number): Promise<void>
  del(key: string): Promise<void>
}

export class RedisJsonCache implements JsonCache {
  constructor(private readonly redis = new Redis(loadEnv().REDIS_URL)) {}

  async getJson<T>(key: string): Promise<T | null> {
    const raw = await this.redis.get(key)
    return raw ? (JSON.parse(raw) as T) : null
  }

  async setJson<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
    await this.redis.set(key, JSON.stringify(value), 'EX', ttlSeconds)
  }

  async del(key: string): Promise<void> {
    await this.redis.del(key)
  }
}
```

- [ ] **Step 4: Implement repository and service**

Create `apps/api/src/repositories/public-site.repository.ts` with a `getPublicSite()` method that reads active services, categories, staff, media, and the single `shop_settings` row from Drizzle, then returns:

```ts
export interface PublicSitePayload {
  shop: {
    name: string
    tagline: string
    description: string
    phone: string
    email: string | null
    address: string
    mapUrl: string | null
    openingHours: Record<string, string>
    seoTitle: string
    seoDescription: string
  }
  services: Array<{
    id: string
    categoryId: string
    categoryName: string
    name: string
    description: string
    durationMinutes: number
    priceCents: number
    imageUrl: string | null
  }>
  staff: Array<{
    id: string
    name: string
    title: string
    bio: string
    imageUrl: string | null
  }>
  gallery: Array<{
    id: string
    url: string
    altText: string
  }>
}
```

Create `apps/api/src/services/public-site.service.ts`:

```ts
import type { JsonCache } from '../cache/redis'
import type { PublicSitePayload } from '../repositories/public-site.repository'

const PUBLIC_SITE_CACHE_KEY = 'public:site'

export class PublicSiteService {
  constructor(
    private readonly repository: { getPublicSite(): Promise<PublicSitePayload> },
    private readonly cache: Pick<JsonCache, 'getJson' | 'setJson'>
  ) {}

  async getPublicSite(): Promise<PublicSitePayload> {
    const cached = await this.cache.getJson<PublicSitePayload>(PUBLIC_SITE_CACHE_KEY)
    if (cached) return cached

    const payload = await this.repository.getPublicSite()
    await this.cache.setJson(PUBLIC_SITE_CACHE_KEY, payload, 300)
    return payload
  }
}
```

- [ ] **Step 5: Mount public route**

Create `apps/api/src/routes/public.ts` with `GET /site` returning `PublicSiteService.getPublicSite()`.

Modify `apps/api/src/app.ts` so `createApp()` mounts:

```ts
import { publicRoutes } from './routes/public'

app.route('/public', publicRoutes())
```

- [ ] **Step 6: Verify tests and route**

Run:

```bash
docker compose run --rm tooling pnpm --filter @nailly/api test src/services/public-site.service.test.ts
docker compose run --rm tooling pnpm --filter @nailly/api lint
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add apps/api/src
git commit -m "feat: add cached public site api"
```

---

### Task 6: Availability and Public Booking API

**Files:**
- Create: `apps/api/src/services/availability.service.test.ts`
- Create: `apps/api/src/services/availability.service.ts`
- Create: `apps/api/src/services/booking.service.test.ts`
- Create: `apps/api/src/services/booking.service.ts`
- Create: `apps/api/src/repositories/booking.repository.ts`
- Modify: `apps/api/src/routes/public.ts`

- [ ] **Step 1: Write failing availability tests**

Create `apps/api/src/services/availability.service.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { buildTimeSlots } from './availability.service'

describe('buildTimeSlots', () => {
  it('builds 30-minute slots inside business hours and leaves room for service duration', () => {
    const slots = buildTimeSlots({
      startTime: '09:00',
      endTime: '11:00',
      durationMinutes: 60,
      blockedStarts: new Set(['09:30'])
    })

    expect(slots).toEqual([
      { time: '09:00', available: true },
      { time: '09:30', available: false },
      { time: '10:00', available: true }
    ])
  })
})
```

- [ ] **Step 2: Run availability test to verify it fails**

Run:

```bash
docker compose run --rm tooling pnpm --filter @nailly/api test src/services/availability.service.test.ts
```

Expected: FAIL because `availability.service.ts` does not exist.

- [ ] **Step 3: Implement availability slot builder**

Create `apps/api/src/services/availability.service.ts` with:

```ts
export interface TimeSlot {
  time: string
  available: boolean
}

function toMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

function toTime(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`
}

export function buildTimeSlots(input: {
  startTime: string
  endTime: string
  durationMinutes: number
  blockedStarts: Set<string>
}): TimeSlot[] {
  const start = toMinutes(input.startTime)
  const latestStart = toMinutes(input.endTime) - input.durationMinutes
  const slots: TimeSlot[] = []

  for (let cursor = start; cursor <= latestStart; cursor += 30) {
    const time = toTime(cursor)
    slots.push({ time, available: !input.blockedStarts.has(time) })
  }

  return slots
}
```

- [ ] **Step 4: Write failing booking service tests**

Create `apps/api/src/services/booking.service.test.ts`:

```ts
import { describe, expect, it, vi } from 'vitest'
import { ApiError } from '../http/errors'
import { BookingService } from './booking.service'

describe('BookingService', () => {
  it('creates public bookings with pending confirmation status', async () => {
    const repository = {
      getTotalDuration: vi.fn().mockResolvedValue(60),
      isSlotAvailable: vi.fn().mockResolvedValue(true),
      createBooking: vi.fn().mockResolvedValue({ id: 'booking-1', status: 'pending_confirmation' })
    }

    const service = new BookingService(repository)
    const result = await service.createPublicBooking({
      customerName: 'Avery Stone',
      phone: '+1 555 0100',
      partySize: 1,
      serviceIds: ['svc-1'],
      staffId: 'staff-1',
      appointmentDate: '2026-06-03',
      startTime: '10:00'
    })

    expect(result.status).toBe('pending_confirmation')
    expect(repository.createBooking).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'pending_confirmation' }),
      60
    )
  })

  it('rejects bookings when the slot is no longer available', async () => {
    const repository = {
      getTotalDuration: vi.fn().mockResolvedValue(60),
      isSlotAvailable: vi.fn().mockResolvedValue(false),
      createBooking: vi.fn()
    }

    const service = new BookingService(repository)

    await expect(
      service.createPublicBooking({
        customerName: 'Avery Stone',
        phone: '+1 555 0100',
        partySize: 1,
        serviceIds: ['svc-1'],
        staffId: 'staff-1',
        appointmentDate: '2026-06-03',
        startTime: '10:00'
      })
    ).rejects.toEqual(new ApiError(409, 'slot_unavailable', 'This time is no longer available.'))
  })
})
```

- [ ] **Step 5: Run booking test to verify it fails**

Run:

```bash
docker compose run --rm tooling pnpm --filter @nailly/api test src/services/booking.service.test.ts
```

Expected: FAIL because `booking.service.ts` does not exist.

- [ ] **Step 6: Implement booking service and repository**

Create `apps/api/src/services/booking.service.ts`:

```ts
import type { CreateBookingInput } from '@nailly/shared'
import { createBookingSchema } from '@nailly/shared'
import { ApiError } from '../http/errors'

export class BookingService {
  constructor(
    private readonly repository: {
      getTotalDuration(serviceIds: string[]): Promise<number>
      isSlotAvailable(input: {
        staffId?: string | null
        appointmentDate: string
        startTime: string
        durationMinutes: number
      }): Promise<boolean>
      createBooking(input: ReturnType<typeof createBookingSchema.parse>, durationMinutes: number): Promise<{
        id: string
        status: string
      }>
    }
  ) {}

  async createPublicBooking(input: CreateBookingInput) {
    const parsed = createBookingSchema.parse(input)
    const durationMinutes = await this.repository.getTotalDuration(parsed.serviceIds)
    const available = await this.repository.isSlotAvailable({
      staffId: parsed.staffId,
      appointmentDate: parsed.appointmentDate,
      startTime: parsed.startTime,
      durationMinutes
    })

    if (!available) {
      throw new ApiError(409, 'slot_unavailable', 'This time is no longer available.')
    }

    return this.repository.createBooking(parsed, durationMinutes)
  }
}
```

Create `apps/api/src/repositories/booking.repository.ts` with Drizzle methods for total duration, blocked starts, slot availability, staff capability lookup, and transactional booking insertion into `bookings` and `booking_services`. If `staffId` is `null`, choose the first active staff member who can perform all selected services and is available for the requested slot; store that assigned staff ID on the booking. If no staff member is available, return `false` from `isSlotAvailable`.

- [ ] **Step 7: Add public endpoints**

Modify `apps/api/src/routes/public.ts`:

- `GET /availability` validates query with `publicAvailabilityQuerySchema`, loads service duration and blocked booking starts, returns slots from `buildTimeSlots`.
- `POST /bookings` validates JSON with `createBookingSchema`, calls `BookingService.createPublicBooking()`, and returns status `201` with booking ID and message:

```json
{
  "bookingId": "generated-id",
  "status": "pending_confirmation",
  "message": "Request received. We will contact you to confirm your appointment."
}
```

- [ ] **Step 8: Verify tests**

Run:

```bash
docker compose run --rm tooling pnpm --filter @nailly/api test src/services/availability.service.test.ts src/services/booking.service.test.ts
docker compose run --rm tooling pnpm --filter @nailly/api lint
```

Expected: PASS.

- [ ] **Step 9: Commit**

```bash
git add apps/api/src
git commit -m "feat: add public availability and booking api"
```

---

### Task 7: Admin Auth and RBAC

**Files:**
- Create: `apps/api/src/http/auth.test.ts`
- Create: `apps/api/src/http/auth.ts`
- Create: `apps/api/src/http/rbac.test.ts`
- Create: `apps/api/src/http/rbac.ts`
- Create: `apps/api/src/services/auth.service.test.ts`
- Create: `apps/api/src/services/auth.service.ts`
- Create: `apps/api/src/repositories/admin-user.repository.ts`
- Create: `apps/api/src/routes/auth.ts`
- Modify: `apps/api/src/app.ts`

- [ ] **Step 1: Write failing RBAC tests**

Create `apps/api/src/http/rbac.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { canAccessRole } from './rbac'

describe('canAccessRole', () => {
  it('allows owners to access every admin capability', () => {
    expect(canAccessRole('owner', ['owner'])).toBe(true)
    expect(canAccessRole('owner', ['manager'])).toBe(true)
    expect(canAccessRole('owner', ['staff'])).toBe(true)
  })

  it('keeps staff out of manager and owner capabilities', () => {
    expect(canAccessRole('staff', ['staff'])).toBe(true)
    expect(canAccessRole('staff', ['manager'])).toBe(false)
    expect(canAccessRole('staff', ['owner'])).toBe(false)
  })
})
```

- [ ] **Step 2: Implement RBAC helper**

Create `apps/api/src/http/rbac.ts`:

```ts
import type { AdminRole } from '@nailly/shared'

const rank: Record<AdminRole, number> = {
  staff: 1,
  manager: 2,
  owner: 3
}

export function canAccessRole(actual: AdminRole, allowed: AdminRole[]): boolean {
  return allowed.some((role) => rank[actual] >= rank[role])
}
```

- [ ] **Step 3: Write failing auth service tests**

Create `apps/api/src/services/auth.service.test.ts`:

```ts
import bcrypt from 'bcryptjs'
import { describe, expect, it, vi } from 'vitest'
import { ApiError } from '../http/errors'
import { AuthService } from './auth.service'

describe('AuthService', () => {
  it('returns a safe admin profile for valid credentials', async () => {
    const passwordHash = await bcrypt.hash('secret-password', 10)
    const repository = {
      findActiveByEmail: vi.fn().mockResolvedValue({
        id: 'admin-1',
        email: 'owner@example.com',
        name: 'Owner',
        role: 'owner',
        passwordHash
      })
    }

    const service = new AuthService(repository)
    const result = await service.login('owner@example.com', 'secret-password')

    expect(result).toEqual({
      id: 'admin-1',
      email: 'owner@example.com',
      name: 'Owner',
      role: 'owner'
    })
  })

  it('rejects invalid credentials with an unauthorized error', async () => {
    const repository = { findActiveByEmail: vi.fn().mockResolvedValue(null) }
    const service = new AuthService(repository)

    await expect(service.login('missing@example.com', 'bad')).rejects.toEqual(
      new ApiError(401, 'invalid_credentials', 'Invalid email or password.')
    )
  })
})
```

- [ ] **Step 4: Implement auth service, JWT cookie helpers, and routes**

Create `apps/api/src/services/auth.service.ts` that finds active users by email, compares passwords with bcrypt, returns `{ id, email, name, role }`, and never returns `passwordHash`.

Create `apps/api/src/http/auth.ts` with:

- `signAdminToken(profile, secret)` using `jose.SignJWT`.
- `verifyAdminToken(token, secret)` using `jose.jwtVerify`.
- `setAdminCookie(c, token, cookieName)` with `httpOnly`, `sameSite: 'Lax'`, `path: '/'`.
- `clearAdminCookie(c, cookieName)`.

Create `apps/api/src/routes/auth.ts`:

- `POST /login` accepts `{ email, password }`, calls `AuthService.login`, sets cookie, returns profile.
- `POST /logout` clears cookie.
- `GET /me` verifies cookie and returns profile.

Mount in `apps/api/src/app.ts`:

```ts
import { authRoutes } from './routes/auth'

app.route('/auth', authRoutes())
```

- [ ] **Step 5: Verify auth tests**

Run:

```bash
docker compose run --rm tooling pnpm --filter @nailly/api test src/http/rbac.test.ts src/services/auth.service.test.ts
docker compose run --rm tooling pnpm --filter @nailly/api lint
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add apps/api/src
git commit -m "feat: add admin auth and role checks"
```

---

### Task 8: Admin Management APIs

**Files:**
- Create: `apps/api/src/routes/admin.test.ts`
- Create: `apps/api/src/routes/admin.ts`
- Create: `apps/api/src/repositories/admin.repository.ts`
- Create: `apps/api/src/services/admin.service.ts`
- Modify: `apps/api/src/app.ts`

- [ ] **Step 1: Write failing admin route tests**

Create `apps/api/src/routes/admin.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { canAccessRole } from '../http/rbac'
import { adminRoutes } from './admin'

describe('admin route permissions', () => {
  it('allows managers to manage bookings and services', () => {
    expect(canAccessRole('manager', ['manager'])).toBe(true)
  })

  it('blocks staff from shop settings', () => {
    expect(canAccessRole('staff', ['manager'])).toBe(false)
  })
})

describe('adminRoutes', () => {
  it('exposes an admin router factory', () => {
    expect(typeof adminRoutes).toBe('function')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
docker compose run --rm tooling pnpm --filter @nailly/api test src/routes/admin.test.ts
```

Expected: FAIL because `apps/api/src/routes/admin.ts` does not exist.

- [ ] **Step 3: Implement admin service and repository**

Create `apps/api/src/repositories/admin.repository.ts` with methods:

- `listBookings(filters)`
- `getBooking(id)`
- `updateBooking(id, input)`
- `updateBookingStatus(id, status)`
- `listServiceCategories()`
- `createServiceCategory(input)`
- `updateServiceCategory(id, input)`
- `listServices()`
- `createService(input)`
- `updateService(id, input)`
- `listStaff()`
- `createStaff(input)`
- `updateStaff(id, input)`
- `getShopSettings()`
- `updateShopSettings(input)`
- `listAdminUsers()`
- `createAdminUser(input)`

Create `apps/api/src/services/admin.service.ts` that calls the repository and invalidates Redis key `public:site` after service, staff, media, or shop settings mutations.

- [ ] **Step 4: Implement admin routes**

Create `apps/api/src/routes/admin.ts` with authenticated routes:

- `GET /bookings`
- `GET /bookings/:id`
- `PATCH /bookings/:id`
- `PATCH /bookings/:id/status`
- `GET /service-categories`
- `POST /service-categories`
- `PATCH /service-categories/:id`
- `GET /services`
- `POST /services`
- `PATCH /services/:id`
- `GET /staff`
- `POST /staff`
- `PATCH /staff/:id`
- `GET /shop-settings`
- `PATCH /shop-settings`
- `GET /admin-users`
- `POST /admin-users`

Role mapping:

- Bookings read/update: `staff`, `manager`, `owner`.
- Services, categories, staff, media, shop settings: `manager`, `owner`.
- Admin users: `owner`.

Mount in `apps/api/src/app.ts`:

```ts
import { adminRoutes } from './routes/admin'

app.route('/admin', adminRoutes())
```

- [ ] **Step 5: Verify admin tests and lint**

Run:

```bash
docker compose run --rm tooling pnpm --filter @nailly/api test src/routes/admin.test.ts
docker compose run --rm tooling pnpm --filter @nailly/api lint
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add apps/api/src
git commit -m "feat: add admin management api"
```

---

### Task 9: MinIO Media Upload API

**Files:**
- Create: `apps/api/src/storage/minio.test.ts`
- Create: `apps/api/src/storage/minio.ts`
- Create: `apps/api/src/services/media.service.test.ts`
- Create: `apps/api/src/services/media.service.ts`
- Modify: `apps/api/src/routes/admin.ts`

- [ ] **Step 1: Write failing media validation tests**

Create `apps/api/src/services/media.service.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { ApiError } from '../http/errors'
import { assertSupportedImage } from './media.service'

describe('assertSupportedImage', () => {
  it('accepts jpg, png, and webp files up to 5MB', () => {
    expect(() => assertSupportedImage({ contentType: 'image/jpeg', sizeBytes: 5_000_000 })).not.toThrow()
    expect(() => assertSupportedImage({ contentType: 'image/png', sizeBytes: 5_000_000 })).not.toThrow()
    expect(() => assertSupportedImage({ contentType: 'image/webp', sizeBytes: 5_000_000 })).not.toThrow()
  })

  it('rejects unsupported files', () => {
    expect(() => assertSupportedImage({ contentType: 'application/pdf', sizeBytes: 1200 })).toThrow(
      new ApiError(400, 'unsupported_media_type', 'Only JPEG, PNG, and WEBP images are allowed.')
    )
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
docker compose run --rm tooling pnpm --filter @nailly/api test src/services/media.service.test.ts
```

Expected: FAIL because `media.service.ts` does not exist.

- [ ] **Step 3: Implement MinIO wrapper and media service**

Create `apps/api/src/storage/minio.ts` with a MinIO client from env values and method:

```ts
uploadObject(input: {
  objectKey: string
  buffer: Buffer
  contentType: string
}): Promise<{ objectKey: string; publicUrl: string }>
```

Create `apps/api/src/services/media.service.ts`:

```ts
import { ApiError } from '../http/errors'

const allowedTypes = new Set(['image/jpeg', 'image/png', 'image/webp'])
const maxImageBytes = 5_000_000

export function assertSupportedImage(input: { contentType: string; sizeBytes: number }) {
  if (!allowedTypes.has(input.contentType)) {
    throw new ApiError(400, 'unsupported_media_type', 'Only JPEG, PNG, and WEBP images are allowed.')
  }

  if (input.sizeBytes > maxImageBytes) {
    throw new ApiError(400, 'file_too_large', 'Images must be 5MB or smaller.')
  }
}
```

Extend `MediaService` with `uploadImage(file, metadata)` that validates, writes to MinIO, saves `media_assets`, invalidates `public:site`, and returns metadata.

- [ ] **Step 4: Add admin media endpoints**

Modify `apps/api/src/routes/admin.ts`:

- `GET /media`
- `POST /media` as multipart upload with `file`, `altText`, and `usageType`.
- `PATCH /media/:id` for alt text and usage type.

Allowed roles: `manager`, `owner`.

- [ ] **Step 5: Verify media tests**

Run:

```bash
docker compose run --rm tooling pnpm --filter @nailly/api test src/services/media.service.test.ts
docker compose run --rm tooling pnpm --filter @nailly/api lint
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add apps/api/src
git commit -m "feat: add minio media upload api"
```

---

### Task 10: Nuxt App Foundation

**Files:**
- Create: `apps/web/package.json`
- Create: `apps/web/nuxt.config.ts`
- Create: `apps/web/tsconfig.json`
- Create: `apps/web/app.vue`
- Create: `apps/web/assets/css/main.css`
- Create: `apps/web/i18n/locales/en.json`
- Create: `apps/web/plugins/api.ts`
- Create: `apps/web/stores/session.ts`
- Create: `apps/web/middleware/admin-auth.ts`
- Create: `apps/web/tests/api-client.test.ts`

- [ ] **Step 1: Create web package metadata**

Create `apps/web/package.json`:

```json
{
  "name": "@nailly/web",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "nuxt dev",
    "build": "nuxt build",
    "generate": "nuxt generate",
    "preview": "nuxt preview",
    "test": "vitest run",
    "lint": "nuxt typecheck"
  },
  "dependencies": {
    "@nuxt/devtools": "latest",
    "@nuxt/eslint": "latest",
    "@nuxt/fonts": "latest",
    "@nuxt/icon": "latest",
    "@nuxt/image": "latest",
    "@nuxt/ui": "latest",
    "@nuxtjs/i18n": "latest",
    "@nuxtjs/seo": "latest",
    "@pinia/nuxt": "latest",
    "@nailly/shared": "workspace:*",
    "nuxt": "latest",
    "pinia": "latest",
    "vue": "latest"
  },
  "devDependencies": {
    "@nuxt/test-utils": "latest",
    "@types/node": "^22.15.0",
    "typescript": "^5.8.0",
    "vitest": "^3.1.0",
    "vue-tsc": "^2.2.0"
  }
}
```

- [ ] **Step 2: Write failing API client test**

Create `apps/web/tests/api-client.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { buildApiUrl } from '../utils/api-url'

describe('buildApiUrl', () => {
  it('joins base URL and path without duplicate slashes', () => {
    expect(buildApiUrl('http://localhost:8787/', '/public/site')).toBe('http://localhost:8787/public/site')
  })
})
```

- [ ] **Step 3: Run test to verify it fails**

Run:

```bash
docker compose run --rm tooling pnpm install
docker compose run --rm tooling pnpm --filter @nailly/web test
```

Expected: FAIL because `apps/web/utils/api-url.ts` does not exist.

- [ ] **Step 4: Implement Nuxt config and app shell**

Create `apps/web/nuxt.config.ts`:

```ts
export default defineNuxtConfig({
  devtools: { enabled: true },
  modules: [
    '@nuxt/devtools',
    '@nuxt/icon',
    '@nuxt/eslint',
    '@nuxt/fonts',
    '@nuxt/image',
    '@nuxt/ui',
    '@pinia/nuxt',
    '@nuxtjs/i18n',
    '@nuxtjs/seo'
  ],
  css: ['~/assets/css/main.css'],
  runtimeConfig: {
    public: {
      apiBaseUrl: process.env.PUBLIC_API_BASE_URL ?? 'http://localhost:8787'
    }
  },
  i18n: {
    defaultLocale: 'en',
    locales: [{ code: 'en', name: 'English', file: 'en.json' }],
    lazy: true,
    langDir: 'i18n/locales'
  },
  app: {
    head: {
      htmlAttrs: { lang: 'en' }
    }
  }
})
```

Create `apps/web/tsconfig.json`:

```json
{
  "extends": "../../tsconfig.base.json",
  "include": ["**/*.ts", "**/*.vue", ".nuxt/**/*.ts"]
}
```

Create `apps/web/app.vue`:

```vue
<template>
  <UApp>
    <NuxtPage />
  </UApp>
</template>
```

Create `apps/web/assets/css/main.css` with CSS variables for a warm neutral background, ink text color, blue primary action color, accessible focus rings, and responsive container widths. Keep cards at `8px` border radius.

Create `apps/web/i18n/locales/en.json` with keys:

```json
{
  "nav": {
    "book": "Book appointment",
    "admin": "Admin"
  },
  "booking": {
    "title": "Book an appointment",
    "submit": "Request appointment",
    "success": "Request received. We will contact you to confirm your appointment."
  },
  "admin": {
    "login": "Admin login",
    "bookings": "Bookings",
    "services": "Services",
    "staff": "Staff",
    "media": "Media",
    "settings": "Settings"
  }
}
```

- [ ] **Step 5: Implement API URL helper, plugin, store, and middleware**

Create `apps/web/utils/api-url.ts`:

```ts
export function buildApiUrl(baseUrl: string, path: string) {
  return `${baseUrl.replace(/\/$/, '')}/${path.replace(/^\//, '')}`
}
```

Create `apps/web/plugins/api.ts`:

```ts
import { buildApiUrl } from '~/utils/api-url'

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()

  return {
    provide: {
      api: <T>(path: string, options: Parameters<typeof $fetch<T>>[1] = {}) =>
        $fetch<T>(buildApiUrl(config.public.apiBaseUrl, path), {
          credentials: 'include',
          ...options
        })
    }
  }
})
```

Create `apps/web/stores/session.ts` with Pinia state `{ user: null, loaded: false }`, `loadMe`, `login`, and `logout` actions using `$api`.

Create `apps/web/middleware/admin-auth.ts` that redirects unauthenticated users from `/admin/*` to `/admin/login`.

- [ ] **Step 6: Verify web foundation**

Run:

```bash
docker compose run --rm tooling pnpm --filter @nailly/web test
docker compose run --rm tooling pnpm --filter @nailly/web lint
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add apps/web
git commit -m "feat: add nuxt app foundation"
```

---

### Task 11: Landing Page

**Files:**
- Create: `apps/web/pages/index.vue`
- Create: `apps/web/components/PublicNav.vue`
- Create: `apps/web/components/ServiceCard.vue`
- Create: `apps/web/components/GalleryGrid.vue`
- Create: `apps/web/tests/landing-content.test.ts`

- [ ] **Step 1: Write failing landing content test**

Create `apps/web/tests/landing-content.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { formatPrice } from '../utils/format'

describe('formatPrice', () => {
  it('formats cents as USD for demo content', () => {
    expect(formatPrice(5200)).toBe('$52')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
docker compose run --rm tooling pnpm --filter @nailly/web test tests/landing-content.test.ts
```

Expected: FAIL because `utils/format.ts` does not exist.

- [ ] **Step 3: Implement formatting helper**

Create `apps/web/utils/format.ts`:

```ts
export function formatPrice(priceCents: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  }).format(priceCents / 100)
}
```

- [ ] **Step 4: Build public landing components**

Create:

- `PublicNav.vue`: logo text `Luma Nail Studio`, links to `/`, `/booking`, and `/admin/login`.
- `ServiceCard.vue`: displays service name, description, duration, and formatted price.
- `GalleryGrid.vue`: responsive image grid using `NuxtImg` with alt text.

Create `apps/web/pages/index.vue` that fetches `/public/site`, sets SEO title/description from the payload, and renders sections:

- hero
- featured services
- why choose us
- gallery
- staff highlight
- opening hours/location
- CTA to `/booking`

Use real seeded content from the API. Use restrained, polished nail-salon styling with clear scan hierarchy and no marketing-only filler screen.

- [ ] **Step 5: Verify tests and build**

Run:

```bash
docker compose run --rm tooling pnpm --filter @nailly/web test tests/landing-content.test.ts
docker compose run --rm tooling pnpm --filter @nailly/web build
```

Expected: tests PASS and Nuxt build exits with code `0`.

- [ ] **Step 6: Commit**

```bash
git add apps/web
git commit -m "feat: build public landing page"
```

---

### Task 12: Public Booking Page

**Files:**
- Create: `apps/web/pages/booking.vue`
- Create: `apps/web/components/BookingForm.vue`
- Create: `apps/web/components/TimeSlotGrid.vue`
- Create: `apps/web/tests/booking-form.test.ts`

- [ ] **Step 1: Write failing booking view-model test**

Create `apps/web/tests/booking-form.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { buildBookingPayload } from '../utils/booking-payload'

describe('buildBookingPayload', () => {
  it('creates public booking payload with optional email and note omitted when blank', () => {
    expect(
      buildBookingPayload({
        customerName: 'Avery Stone',
        phone: '+1 555 0100',
        email: '',
        note: '',
        partySize: 1,
        serviceIds: ['svc-1'],
        staffId: null,
        appointmentDate: '2026-06-03',
        startTime: '10:00'
      })
    ).toEqual({
      customerName: 'Avery Stone',
      phone: '+1 555 0100',
      partySize: 1,
      serviceIds: ['svc-1'],
      staffId: null,
      appointmentDate: '2026-06-03',
      startTime: '10:00'
    })
  })
})
```

- [ ] **Step 2: Implement booking payload helper**

Create `apps/web/utils/booking-payload.ts`:

```ts
import type { CreateBookingInput } from '@nailly/shared'

export function buildBookingPayload(input: CreateBookingInput): CreateBookingInput {
  return {
    customerName: input.customerName,
    phone: input.phone,
    ...(input.email ? { email: input.email } : {}),
    partySize: input.partySize,
    serviceIds: input.serviceIds,
    staffId: input.staffId ?? null,
    appointmentDate: input.appointmentDate,
    startTime: input.startTime,
    ...(input.note ? { note: input.note } : {})
  }
}
```

- [ ] **Step 3: Build booking UI**

Create `BookingForm.vue` with:

- customer name
- phone
- optional email
- party size
- service multi-select
- optional staff select
- date input
- time slot grid
- optional note
- submit button with calendar icon
- success and error states

Create `TimeSlotGrid.vue` with fixed responsive grid tracks and selected state. Fetch `/public/availability` when date or services change. Disable unavailable slots.

Create `pages/booking.vue` with a focused layout: form on the left, compact shop summary on the right for desktop, stacked on mobile. Do not include branch selection.

- [ ] **Step 4: Verify booking tests and build**

Run:

```bash
docker compose run --rm tooling pnpm --filter @nailly/web test tests/booking-form.test.ts
docker compose run --rm tooling pnpm --filter @nailly/web build
```

Expected: tests PASS and Nuxt build exits with code `0`.

- [ ] **Step 5: Commit**

```bash
git add apps/web
git commit -m "feat: build public booking page"
```

---

### Task 13: Admin Dashboard Pages

**Files:**
- Create: `apps/web/pages/admin/login.vue`
- Create: `apps/web/pages/admin/index.vue`
- Create: `apps/web/pages/admin/bookings.vue`
- Create: `apps/web/pages/admin/services.vue`
- Create: `apps/web/pages/admin/staff.vue`
- Create: `apps/web/pages/admin/media.vue`
- Create: `apps/web/pages/admin/settings.vue`
- Create: `apps/web/components/AdminShell.vue`
- Create: `apps/web/tests/admin-nav.test.ts`

- [ ] **Step 1: Write failing admin navigation test**

Create `apps/web/tests/admin-nav.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { adminNavItems } from '../utils/admin-nav'

describe('adminNavItems', () => {
  it('shows staff users only booking access', () => {
    expect(adminNavItems('staff').map((item) => item.label)).toEqual(['Bookings'])
  })

  it('shows owners all admin areas', () => {
    expect(adminNavItems('owner').map((item) => item.label)).toEqual([
      'Overview',
      'Bookings',
      'Services',
      'Staff',
      'Media',
      'Settings'
    ])
  })
})
```

- [ ] **Step 2: Implement admin nav helper**

Create `apps/web/utils/admin-nav.ts`:

```ts
import type { AdminRole } from '@nailly/shared'

const items = [
  { label: 'Overview', to: '/admin', minRole: 'manager' },
  { label: 'Bookings', to: '/admin/bookings', minRole: 'staff' },
  { label: 'Services', to: '/admin/services', minRole: 'manager' },
  { label: 'Staff', to: '/admin/staff', minRole: 'manager' },
  { label: 'Media', to: '/admin/media', minRole: 'manager' },
  { label: 'Settings', to: '/admin/settings', minRole: 'manager' }
] as const

const rank: Record<AdminRole, number> = { staff: 1, manager: 2, owner: 3 }

export function adminNavItems(role: AdminRole) {
  return items.filter((item) => rank[role] >= rank[item.minRole])
}
```

- [ ] **Step 3: Build admin shell and login**

Create `AdminShell.vue` with sidebar navigation, topbar user menu, and logout action.

Create `pages/admin/login.vue` with email/password form and default demo credential hint:

```text
owner@lumanails.example / owner-password
manager@lumanails.example / manager-password
staff@lumanails.example / staff-password
```

Create `pages/admin/index.vue` overview with counts from admin endpoints.

- [ ] **Step 4: Build admin resource pages**

Create:

- `bookings.vue`: table with status filter, detail drawer, status update action.
- `services.vue`: category/service list, create/edit modal, active toggle.
- `staff.vue`: staff list, create/edit modal, service assignment checkboxes.
- `media.vue`: upload form and gallery list.
- `settings.vue`: shop profile, opening hours, SEO fields.

Use Nuxt UI form controls, icons for actions, and restrained dashboard density. Keep controls stable on mobile and desktop.

- [ ] **Step 5: Verify admin tests and build**

Run:

```bash
docker compose run --rm tooling pnpm --filter @nailly/web test tests/admin-nav.test.ts
docker compose run --rm tooling pnpm --filter @nailly/web build
```

Expected: tests PASS and Nuxt build exits with code `0`.

- [ ] **Step 6: Commit**

```bash
git add apps/web
git commit -m "feat: build admin dashboard"
```

---

### Task 14: End-to-End Local Verification and Documentation

**Files:**
- Create: `README.md`
- Modify: any files needed to fix verification failures found in this task.

- [ ] **Step 1: Write setup documentation**

Create `README.md`:

```md
# Nailly

Full-stack nail salon booking MVP with Nuxt, Hono, PostgreSQL, Redis, MinIO, and Docker Compose.

## Requirements

- Docker
- Docker Compose

Node and pnpm are run inside Docker.

## Local Setup

```bash
cp .env.example .env
docker compose run --rm tooling pnpm install
docker compose up -d postgres redis minio minio-init
docker compose run --rm tooling pnpm --filter @nailly/api db:push
docker compose run --rm tooling pnpm --filter @nailly/api db:seed
docker compose up api web
```

Web: http://localhost:3000
API health: http://localhost:8787/health
MinIO console: http://localhost:9001

## Demo Admin Accounts

- owner@lumanails.example / owner-password
- manager@lumanails.example / manager-password
- staff@lumanails.example / staff-password

## Verification

```bash
docker compose run --rm tooling pnpm -r test
docker compose run --rm tooling pnpm -r lint
docker compose run --rm tooling pnpm -r build
```
```

- [ ] **Step 2: Run complete verification**

Run:

```bash
docker compose run --rm tooling pnpm -r test
docker compose run --rm tooling pnpm -r lint
docker compose run --rm tooling pnpm -r build
docker compose up -d postgres redis minio minio-init api web
curl -fsS http://localhost:8787/health
curl -fsS http://localhost:8787/public/site
```

Expected:

- All tests exit with code `0`.
- All lint/typecheck commands exit with code `0`.
- All builds exit with code `0`.
- Health endpoint returns `{"ok":true,"service":"nailly-api"}`.
- Public site endpoint returns shop name `Luma Nail Studio`.

- [ ] **Step 3: Capture UI smoke check**

Open or request browser verification for:

- `http://localhost:3000`
- `http://localhost:3000/booking`
- `http://localhost:3000/admin/login`

Expected:

- Landing page loads with service cards, gallery, staff highlight, and booking CTA.
- Booking page shows no branch selector and can submit a valid booking.
- Admin login accepts owner demo credentials and redirects to dashboard.

- [ ] **Step 4: Commit docs and verification fixes**

```bash
git add README.md apps packages docker-compose.yml package.json pnpm-workspace.yaml
git commit -m "docs: add local setup and verification"
```

---

## Final Requirement Checklist

- [ ] Public landing page exists at `/`.
- [ ] Public booking page exists at `/booking`.
- [ ] Admin dashboard exists at `/admin`.
- [ ] Customers can book without accounts.
- [ ] Public booking creates `pending_confirmation`.
- [ ] No branch selection appears.
- [ ] No payment flow appears.
- [ ] Admin auth supports owner, manager, and staff.
- [ ] PostgreSQL stores source-of-truth data.
- [ ] Redis caches public site data.
- [ ] MinIO stores uploaded media.
- [ ] Seed data creates a complete demo salon.
- [ ] Docker Compose can run the stack without host Node.
- [ ] Tests, typecheck/lint, and builds pass through Docker.
