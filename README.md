# Nailly

Nailly là MVP full-stack cho salon nail: public site, booking flow, admin dashboard, quản lý dịch vụ, nhân sự, media, thông tin salon và finance suite cho POS, invoices, payments, refunds, reports.

Stack chính:

- Nuxt 4 cho web app
- Hono cho API
- PostgreSQL cho dữ liệu
- Redis cho cache public site
- MinIO cho media upload
- Bun workspace cho package tooling
- Docker Compose cho local development

## Tài Liệu

- User manual: [docs/user-manual.md](docs/user-manual.md)
- Warm Editorial redesign spec: [docs/superpowers/specs/2026-05-13-warm-editorial-product-redesign.md](docs/superpowers/specs/2026-05-13-warm-editorial-product-redesign.md)
- Nail booking platform plan: [docs/superpowers/plans/2026-05-12-nail-booking-platform.md](docs/superpowers/plans/2026-05-12-nail-booking-platform.md)

## Yêu Cầu

- Docker
- Docker Compose
- Không bắt buộc cài Bun trên máy host, vì repo có thể chạy Bun qua container `tooling`.

## Chạy Dev Lần Đầu

1. Tạo file môi trường:

```bash
cp .env.example .env
```

2. Cài dependencies:

```bash
docker compose run --rm tooling bun install
```

3. Chạy infrastructure:

```bash
docker compose up -d postgres redis minio minio-init
```

4. Tạo schema và seed demo data:

```bash
docker compose run --rm tooling bun --filter @nailly/api db:push
docker compose run --rm tooling bun --filter @nailly/api db:seed
```

5. Chạy API và web:

```bash
docker compose up api web
```

Docker Desktop trên macOS/Windows có thể mất vài giây để API kết nối được PostgreSQL/Redis sau khi container healthy. Nếu web báo lỗi fetch lúc mới start, refresh lại sau khi API sẵn sàng.

## URL Local

- Public site: http://localhost:3000
- Booking: http://localhost:3000/booking
- Admin login: http://localhost:3000/admin/login
- API health: http://localhost:8787/health
- MinIO console: http://localhost:9101

MinIO demo:

- Username: `nailly`
- Password: `nailly-password`

## Demo Admin Accounts

- Owner: `owner@lumanails.example` / `owner-password`
- Manager: `manager@lumanails.example` / `manager-password`
- Staff: `staff@lumanails.example` / `staff-password`

Role access:

- `owner`: toàn quyền admin.
- `manager`: overview, bookings, POS, invoices, reports, services, staff, media, settings.
- `staff`: bookings, POS và invoices.

## Lệnh Thường Dùng

Install dependencies:

```bash
docker compose run --rm tooling bun install
```

Chạy dev stack:

```bash
docker compose up api web
```

Dừng stack:

```bash
docker compose down
```

Reset toàn bộ local database và object storage:

```bash
docker compose down -v
docker compose up -d postgres redis minio minio-init
docker compose run --rm tooling bun --filter @nailly/api db:push
docker compose run --rm tooling bun --filter @nailly/api db:seed
```

Chạy API hoặc web riêng:

```bash
docker compose up api
docker compose up web
```

## Finance Suite Smoke Test

1. Start stack:

```bash
docker compose up api web
```

2. Nếu database vừa reset, seed demo data:

```bash
docker compose run --rm tooling bun --filter @nailly/api db:seed
```

3. Log in at http://localhost:3000/admin/login with `owner@lumanails.example` / `owner-password`.
4. Open http://localhost:3000/admin/pos, create a walk-in invoice, and record payment.
5. Open http://localhost:3000/admin/invoices, view the invoice, print receipt/A4, and issue a partial refund.
6. Open http://localhost:3000/admin/reports and export invoices CSV.

## Verification

Lint/typecheck:

```bash
docker compose run --rm tooling bun --filter @nailly/web lint
docker compose run --rm tooling bun --filter @nailly/api lint
docker compose run --rm tooling bun --filter @nailly/shared lint
```

Build:

```bash
docker compose run --rm tooling bun --filter @nailly/web build
docker compose run --rm tooling bun --filter @nailly/api build
docker compose run --rm tooling bun --filter @nailly/shared build
```

Tests nên chạy bằng Node container. Trong image Bun hiện tại, Vitest worker có thể fail với lỗi `Cannot access 'dispose' before initialization`.

```bash
docker run --rm -v "$PWD":/workspace -w /workspace/apps/web node:22-bookworm-slim ../../node_modules/.bin/vitest run
docker run --rm -v "$PWD":/workspace -w /workspace/apps/api node:22-bookworm-slim ../../node_modules/.bin/vitest run
docker run --rm -v "$PWD":/workspace -w /workspace/packages/shared node:22-bookworm-slim ../../node_modules/.bin/vitest run
```

## Cấu Trúc Repo

```text
apps/
  api/       Hono API, routes, repositories, services, database schema
  web/       Nuxt app, public site, booking flow, admin dashboard
packages/
  shared/    Shared schemas and types
docs/
  user-manual.md
  superpowers/
```

## Troubleshooting

### Port đã bị chiếm

Default ports:

- Web: `3000`
- API: `8787`
- PostgreSQL host port: `5434`
- Redis: `6379`
- MinIO API: `9100`
- MinIO console: `9101`

Kiểm tra process đang giữ port:

```bash
lsof -nP -iTCP:3000 -sTCP:LISTEN
lsof -nP -iTCP:8787 -sTCP:LISTEN
```

### Admin login không được

Chạy lại seed demo data:

```bash
docker compose run --rm tooling bun --filter @nailly/api db:seed
```

Sau đó đăng nhập lại bằng `owner@lumanails.example` / `owner-password`.

### Public site không thấy data mới

Admin update services, staff, media hoặc settings sẽ invalidate Redis cache. Nếu đang debug trực tiếp, có thể restart Redis/cache bằng:

```bash
docker compose restart redis
```

### Upload media fail

Kiểm tra MinIO đã chạy và bucket đã được tạo:

```bash
docker compose up -d minio minio-init
```

Chỉ upload ảnh `jpeg`, `png`, hoặc `webp`.
