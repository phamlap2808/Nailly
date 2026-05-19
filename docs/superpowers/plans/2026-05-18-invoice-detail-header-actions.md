# Invoice Detail Header Actions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a clear back link to invoice detail pages and replace the two print buttons with one compact print icon dropdown.

**Architecture:** Keep the change local to the invoice detail page. Use a focused static regression test to pin the presence of the new navigation and print controls, then add a small local dropdown implementation with Vue state, outside-click handling, and keyboard dismissal.

**Tech Stack:** Nuxt 4, Vue 3 `<script setup>`, Nuxt Icon, Vitest.

---

## File Structure Map

- `apps/web/tests/invoice-detail-actions.test.ts`: focused regression coverage for the new header controls.
- `apps/web/pages/admin/invoices/[id]/index.vue`: add the back link, icon dropdown markup, menu state, event handlers, and local styles.

### Task 1: Add Invoice Detail Header Controls

**Files:**
- Create: `apps/web/tests/invoice-detail-actions.test.ts`
- Modify: `apps/web/pages/admin/invoices/[id]/index.vue`

- [ ] **Step 1: Write the failing test**

Create `apps/web/tests/invoice-detail-actions.test.ts`:

```ts
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const invoiceDetailPage = readFileSync(
  new URL('../pages/admin/invoices/[id]/index.vue', import.meta.url),
  'utf8'
)

describe('invoice detail header actions', () => {
  it('exposes a back link and a consolidated print menu', () => {
    expect(invoiceDetailPage).toContain('to="/admin/invoices"')
    expect(invoiceDetailPage).toContain('Back to invoices')
    expect(invoiceDetailPage).toContain('aria-label="Print"')
    expect(invoiceDetailPage).toContain('name="lucide:printer"')
    expect(invoiceDetailPage).toContain('role="menu"')
    expect(invoiceDetailPage).toContain('Print receipt')
    expect(invoiceDetailPage).toContain('Print A4')
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run:

```bash
bun --filter @nailly/web test -- tests/invoice-detail-actions.test.ts
```

Expected: FAIL because the current invoice detail page does not yet contain the back link or print menu.

- [ ] **Step 3: Add the minimal header implementation**

Update `apps/web/pages/admin/invoices/[id]/index.vue` to:

- Add `Back to invoices` as a `NuxtLink` above the eyebrow text.
- Replace the two print links with an icon button using `<Icon name="lucide:printer" />`.
- Add a dropdown menu with `Print receipt` and `Print A4` links.
- Add local state and handlers:

```ts
const printMenuOpen = ref(false)
const printMenuRef = ref<HTMLElement | null>(null)

function closePrintMenu() {
  printMenuOpen.value = false
}

function handleDocumentPointerDown(event: PointerEvent) {
  if (!printMenuRef.value?.contains(event.target as Node)) {
    closePrintMenu()
  }
}

function handleDocumentKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    closePrintMenu()
  }
}

onMounted(() => {
  document.addEventListener('pointerdown', handleDocumentPointerDown)
  document.addEventListener('keydown', handleDocumentKeydown)
})

onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', handleDocumentPointerDown)
  document.removeEventListener('keydown', handleDocumentKeydown)
})
```

- Add scoped styles for:
  - `.back-link`
  - `.print-menu`
  - `.icon-button`
  - `.print-dropdown`
  - `.print-dropdown a`

- [ ] **Step 4: Run the focused test to verify it passes**

Run:

```bash
bun --filter @nailly/web test -- tests/invoice-detail-actions.test.ts
```

Expected: PASS.

- [ ] **Step 5: Run broader verification**

Run:

```bash
bun --filter @nailly/web test
docker compose run --rm tooling bun --filter @nailly/web lint
docker compose run --rm tooling bun --filter @nailly/web build
```

Expected:

- All web tests pass.
- Typecheck exits with code `0`.
- Build exits with code `0`.

## Self-Review

- Spec coverage: the plan covers the back link, print icon trigger, dropdown options, close behavior, accessibility labels, and responsive styling location.
- Placeholder scan: no `TBD`, `TODO`, or open-ended implementation steps remain.
- Type consistency: all state and handler names used in the plan match the markup they support.
