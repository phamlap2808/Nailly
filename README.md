# Nailly

Full-stack nail salon booking MVP with Nuxt, Hono, PostgreSQL, Redis, MinIO, and Docker Compose.

## Requirements

- Docker
- Docker Compose

Bun is used for JavaScript tooling. Docker Compose runs infrastructure services and can run Bun via the tooling container when needed.

## Local Setup

```bash
cp .env.example .env
docker compose run --rm tooling bun install
docker compose up -d postgres redis minio minio-init
docker compose run --rm tooling bun --filter @nailly/api db:push
docker compose run --rm tooling bun --filter @nailly/api db:seed
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
docker compose run --rm tooling bun --filter '*' test
docker compose run --rm tooling bun --filter '*' lint
docker compose run --rm tooling bun --filter '*' build
```
