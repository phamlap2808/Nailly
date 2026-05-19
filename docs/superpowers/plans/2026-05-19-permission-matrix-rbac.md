# Permission Matrix RBAC Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace coarse role checks with configurable permission checks across the admin API and web app.

**Architecture:** Shared permission constants define the canonical matrix. The API stores role permission overrides in `role_permissions`, falls back to the default matrix when empty, and exposes admin endpoints for owner-level permission management. The web session receives permissions, filters navigation, guards pages, and provides an owner-only permissions matrix screen.

**Tech Stack:** Nuxt/Vue/Pinia for admin UI, Hono API, Drizzle/Postgres schema, Vitest tests, Bun workspace scripts.

---

### Task 1: Shared Permission Model

**Files:**
- Modify: `packages/shared/src/schemas.ts`
- Test: `packages/shared/src/schemas.test.ts`

- [ ] Add `adminPermissionValues`, `adminPermissionSchema`, and `AdminPermission`.
- [ ] Define `defaultRolePermissions` with owner full access, manager operations access, and staff checkout access.
- [ ] Add `hasPermission()` and `permissionsForRole()` helpers.
- [ ] Test default role permission behavior.

### Task 2: API Permission Persistence And Guards

**Files:**
- Modify: `apps/api/src/db/schema.ts`
- Modify: `apps/api/src/repositories/admin.repository.ts`
- Modify: `apps/api/src/services/admin.service.ts`
- Modify: `apps/api/src/routes/auth.ts`
- Modify: `apps/api/src/routes/admin.ts`
- Test: `apps/api/src/http/rbac.test.ts`
- Test: `apps/api/src/repositories/admin.repository.test.ts`

- [ ] Add `role_permissions` table keyed by role and permission.
- [ ] Add repository methods to read role permissions and replace permissions for manager/staff.
- [ ] Include `permissions` in login and `/auth/me` responses.
- [ ] Replace route guards with permission checks.
- [ ] Add `/admin/permissions` GET and PATCH endpoints guarded by `permissions.manage`.

### Task 3: Seed Defaults

**Files:**
- Modify: `apps/api/src/db/seed.ts`
- Modify: `apps/api/src/db/seed-data.test.ts`

- [ ] Seed default permissions for all roles after admin users are seeded.
- [ ] Verify seed coverage includes owner, manager, and staff permission rows.

### Task 4: Web Session, Navigation, And Page Guards

**Files:**
- Modify: `apps/web/stores/session.ts`
- Modify: `apps/web/utils/admin-nav.ts`
- Modify: `apps/web/middleware/admin-auth.ts`
- Create: `apps/web/utils/admin-permissions.ts`
- Create: `apps/web/pages/admin/forbidden.vue`
- Test: `apps/web/tests/admin-nav.test.ts`
- Test: `apps/web/tests/admin-permissions.test.ts`

- [ ] Store permissions on the admin session.
- [ ] Filter sidebar items by permission.
- [ ] Map admin routes to required permissions.
- [ ] Redirect unauthorized direct URL visits to `/admin/forbidden`.

### Task 5: Permissions Matrix UI

**Files:**
- Create: `apps/web/pages/admin/permissions.vue`
- Test: `apps/web/tests/admin-permissions-page.test.ts`

- [ ] Add owner-only Permissions page to the sidebar.
- [ ] Render permission groups and role columns for owner, manager, and staff.
- [ ] Keep owner permissions locked on.
- [ ] Save manager/staff permission changes through `/admin/permissions`.

### Task 6: Verification

**Files:**
- Run only; no file edits.

- [ ] Run targeted shared, API, and web permission tests.
- [ ] Run `bun --filter @nailly/shared lint`, `bun --filter @nailly/api lint`, and `bun --filter @nailly/web lint`.
- [ ] Run DB push for the new table.
