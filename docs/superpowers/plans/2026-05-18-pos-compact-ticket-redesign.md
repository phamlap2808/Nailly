# POS Compact Ticket Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign `/admin/pos` into the approved Compact Ticket layout without backend changes.

**Architecture:** Keep the POS page as a single Nuxt page because the current implementation is small. Use static tests to lock the user-facing layout markers and money-input helpers, then refactor the template/CSS in place.

**Tech Stack:** Nuxt 4, Vue 3 Composition API, TypeScript, scoped CSS, Vitest, Docker Compose.

---

### Task 1: Lock POS UX Markers

**Files:**
- Create: `apps/web/tests/admin-pos-compact-layout.test.ts`

- [ ] **Step 1: Write the failing test**

Create a test that reads `apps/web/pages/admin/pos.vue` and asserts the approved Compact Ticket structure exists.

- [ ] **Step 2: Verify red**

Run:

```bash
docker run --rm -v "$PWD":/workspace -w /workspace/apps/web node:22-alpine node ../../node_modules/vitest/vitest.mjs run tests/admin-pos-compact-layout.test.ts
```

Expected: fail because the current page still uses `pos-layout`, `service-list`, and `Discount cents`.

### Task 2: Implement Compact Ticket Page

**Files:**
- Modify: `apps/web/pages/admin/pos.vue`
- Modify: `apps/web/nuxt.config.ts`

- [ ] **Step 1: Refactor the template**

Move `Save invoice` into the summary panel, replace the long service list with `service-grid`, and render ticket items as compact table-like rows.

- [ ] **Step 2: Add money input helpers**

Display discount, tip, and item unit price as decimal amounts while preserving cents in state and API payloads.

- [ ] **Step 3: Replace scoped CSS**

Implement responsive two-column layout, compact service buttons, ticket table rows, sticky summary, and mobile stack.

- [ ] **Step 4: Verify green**

Run:

```bash
docker run --rm -v "$PWD":/workspace -w /workspace/apps/web node:22-alpine node ../../node_modules/vitest/vitest.mjs run tests/admin-pos-compact-layout.test.ts
docker compose exec -T web bun --filter @nailly/web lint
```

Expected: focused test passes and Nuxt typecheck exits 0.

### Task 3: Browser Check

**Files:**
- No source changes expected.

- [ ] **Step 1: Open `/admin/pos` in the running app**

Use a browser check against `http://localhost:3000/admin/pos` after login.

- [ ] **Step 2: Confirm visible UI**

Expected: service grid renders, ticket area renders, total panel renders, and there are no client-side runtime errors.
