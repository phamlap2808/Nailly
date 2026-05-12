# Nail Booking Platform Design

Date: 2026-05-12
Status: Approved for implementation planning

## Goal

Build a lean production MVP for a nail salon booking website. The product should provide a polished public landing page, a focused booking flow, and an admin dashboard for operating one shop. The UI is English-first, uses professional placeholder branding, and keeps the content easy to replace when real shop information is available.

## Scope

The MVP includes:

- Public landing page at `/`.
- Public booking page at `/booking`.
- Admin dashboard at `/admin`.
- Role-based admin authentication.
- PostgreSQL as the source of truth.
- Hono backend API.
- Nuxt frontend.
- Docker-based local infrastructure.
- Redis cache for public site data.
- MinIO-backed media uploads.
- Seed data for a realistic demo shop.

The MVP excludes:

- Customer accounts.
- Online payment or deposits.
- Multiple branches.
- Deep analytics/reporting.
- Complex staff scheduling automation beyond MVP availability rules.

## Product Experience

### Landing Page

The landing page introduces a single nail salon. It should feel polished and service-oriented, with clear calls to book an appointment.

Sections:

- Hero with placeholder salon name, short value proposition, and primary booking CTA.
- Featured services.
- Why choose us.
- Gallery.
- Staff highlight.
- Opening hours and location.
- CTA section linking to `/booking`.

The landing page should use `@nuxtjs/seo` for metadata, `@nuxt/image` for optimized images, `@nuxt/fonts` for typography, and `@nuxt/icon` for interface icons.

### Booking Page

The booking page is public and does not require a customer account. It should follow the spirit of the provided booking screenshot while removing branch selection because the MVP serves one shop.

Fields:

- Customer name.
- Phone number.
- Optional email.
- Party size.
- Services.
- Optional staff preference.
- Date.
- Available time slot.
- Optional note.

Booking submission creates a record with `pending_confirmation` status. The confirmation message should make it clear that the request was received and the salon will contact the customer to confirm.

### Admin Dashboard

The admin app is available at `/admin` behind authentication.

Core admin sections:

- Bookings: list, filter, view details, update status, edit notes.
- Services and categories: create, update, deactivate, reorder.
- Staff: create, update, deactivate, assign services.
- Gallery/media: upload images to MinIO, edit metadata.
- Shop settings: update address, hotline, opening hours, landing content, SEO text.
- Admin users: manage users and roles according to permissions.

## Technical Architecture

The project will be organized as a monorepo:

```text
apps/
  web/      Nuxt 3 frontend
  api/      Hono backend
packages/
  shared/   Shared TypeScript types and schemas
infra/      Docker compose and service configuration
docs/       Product and implementation documentation
```

### Frontend

`apps/web` will use Nuxt 3 with:

- `@nuxt/devtools`
- `@nuxt/icon`
- `@nuxt/eslint`
- `@nuxt/fonts`
- `@nuxt/image`
- `@nuxt/ui`
- `@pinia/nuxt`
- `@nuxtjs/i18n`
- `@nuxtjs/seo`

The frontend should be English-first, with i18n structure in place so Vietnamese can be added later without reworking routes/components.

### Backend

`apps/api` will use Hono for REST APIs. It owns:

- Public site and booking APIs.
- Admin authentication/session APIs.
- Role-based authorization.
- Booking availability and conflict checks.
- Media upload coordination with MinIO.
- Redis cache reads/writes and invalidation.
- PostgreSQL persistence.

### Infrastructure

Local Docker services:

- PostgreSQL.
- Redis.
- MinIO.
- API service.
- Web service.

PostgreSQL is the source of truth. Redis caches public site data that is expensive or repetitive to assemble. MinIO stores uploaded images; PostgreSQL stores object keys and metadata.

## Data Model

Core tables:

- `shop_settings`: one-shop profile, address, hotline, opening hours, map information, SEO copy, landing content.
- `service_categories`: service grouping and ordering.
- `services`: title, description, duration, price, category, active flag, image reference.
- `staff`: name, title, bio, active flag, image reference.
- `staff_services`: service capability mapping.
- `availability_rules`: regular weekly availability for shop/staff.
- `bookings`: customer details, appointment date/time, party size, status, note, source.
- `booking_services`: selected services for a booking.
- `admin_users`: email, password hash, role, active flag.
- `media_assets`: MinIO object key, content type, alt text, usage type, size metadata.

All mutable tables should have `created_at` and `updated_at`. Admin-managed records should include `created_by` or `updated_by` when useful for traceability.

Booking statuses:

- `pending_confirmation`
- `confirmed`
- `cancelled`
- `completed`
- `no_show`

Admin roles:

- `owner`
- `manager`
- `staff`

## API Design

### Public API

- `GET /public/site`
  - Returns landing content, shop settings, featured services, staff highlights, and gallery.
  - Uses Redis cache.

- `GET /public/availability?date=YYYY-MM-DD&serviceIds=...&staffId=...`
  - Returns available time slots for the requested date and service selection.
  - Validates date and services.

- `POST /public/bookings`
  - Creates a booking with `pending_confirmation` status.
  - Re-checks availability server-side before insert.
  - Returns booking summary and public-facing confirmation message.

### Auth API

- `POST /auth/login`
- `POST /auth/logout`
- `GET /auth/me`

### Admin API

- `GET /admin/bookings`
- `GET /admin/bookings/:id`
- `PATCH /admin/bookings/:id`
- `PATCH /admin/bookings/:id/status`
- CRUD endpoints for service categories.
- CRUD endpoints for services.
- CRUD endpoints for staff.
- CRUD endpoints for media assets.
- `GET /admin/shop-settings`
- `PATCH /admin/shop-settings`
- Owner/manager-scoped admin user endpoints.

## Permissions

`owner` can manage all settings, admin users, services, staff, bookings, media, and shop content.

`manager` can manage bookings, services, staff, media, and shop settings. Managers cannot demote or delete owners.

`staff` can view assigned or relevant bookings and make limited updates such as notes or status changes allowed by business rules. Staff cannot manage shop settings, media library configuration, services, or admin users.

## Validation and Error Handling

API request and response boundaries should use shared schemas where practical.

Validation behavior:

- Public booking returns field-level validation errors.
- Public availability rejects invalid dates, inactive services, and invalid staff selections.
- Booking creation returns a conflict error when a slot is no longer available.
- Admin APIs distinguish unauthenticated, forbidden, not found, validation, and conflict errors.
- Media upload validates content type and size before writing to MinIO.

Booking creation must perform server-side availability checks immediately before persistence to reduce double-booking risk.

## Seed Data

The seed script should create:

- One demo shop profile.
- Opening hours.
- Nail service categories.
- Realistic nail services with durations and prices.
- Several staff profiles.
- Staff-to-service mappings.
- Gallery media metadata.
- Demo admin users for owner, manager, and staff roles.

The seeded app should look complete after local startup.

## Testing Strategy

Backend tests:

- Public booking validation.
- Availability calculation.
- Booking creation and conflict handling.
- Auth login/logout/me.
- Role-based admin authorization.
- Admin CRUD validation for services, staff, media, and shop settings.
- Cache invalidation after admin mutations.

Frontend tests:

- Landing page smoke/render test.
- Booking form validation and successful submit flow.
- Admin protected route behavior.
- Admin booking status update flow.

Infrastructure checks:

- Docker compose starts PostgreSQL, Redis, MinIO, API, and web.
- Seed script can populate a fresh database.
- API can connect to PostgreSQL, Redis, and MinIO through Docker environment variables.

## Implementation Notes

The first implementation plan should prioritize vertical slices:

1. Scaffold monorepo, Docker services, shared tooling.
2. Create database schema and seed data.
3. Implement Hono API health, public site, auth, and booking endpoints.
4. Build Nuxt landing and booking pages.
5. Build admin login and core dashboard pages.
6. Add media upload and cache invalidation.
7. Add tests and final polish.

The design should keep multiple branches out of the MVP. If the salon later needs more locations, branch support can be added through a separate migration and product design pass.
