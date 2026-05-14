# Admin Settings Management Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild `Admin > Settings` as a balanced two-column management form with a live preview panel.

**Architecture:** Keep API calls in `apps/web/pages/admin/settings.vue`. Move save-payload normalization and preview display copy into `apps/web/utils/admin-settings.ts` for test coverage. The page uses existing Warm Editorial admin CSS patterns and does not change backend endpoints.

**Tech Stack:** Nuxt 4, Vue 3 Composition API, TypeScript, Vitest, scoped CSS, existing `$fetch` admin API.

---

## Files

- Create: `apps/web/tests/admin-settings.test.ts`
- Create: `apps/web/utils/admin-settings.ts`
- Modify: `apps/web/pages/admin/settings.vue`

## Task 1: Settings Helper Tests

**Files:**
- Create: `apps/web/tests/admin-settings.test.ts`

- [ ] **Step 1: Write failing tests**

Create `apps/web/tests/admin-settings.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { buildSettingsPreview, buildSettingsSavePayload } from '../utils/admin-settings'

const settings = {
  name: 'Luma Nail Studio',
  tagline: 'Quiet care, polished details',
  description: 'A calm studio for modern nail care.',
  phone: '+1 555 0100',
  email: 'hello@luma.example',
  address: '12 Rose Street',
  mapUrl: 'https://maps.example.com/luma',
  seoTitle: 'Luma Nail Studio | Appointments',
  seoDescription: 'Book manicures, pedicures, and nail art.'
}

describe('admin settings helpers', () => {
  it('normalizes optional fields for the save payload', () => {
    expect(buildSettingsSavePayload({ ...settings, email: '', mapUrl: '   ' })).toMatchObject({
      name: 'Luma Nail Studio',
      email: null,
      mapUrl: null
    })

    expect(buildSettingsSavePayload(settings)).toMatchObject({
      email: 'hello@luma.example',
      mapUrl: 'https://maps.example.com/luma'
    })
  })

  it('builds readable preview copy with fallbacks', () => {
    expect(buildSettingsPreview(settings)).toEqual({
      profileTitle: 'Luma Nail Studio',
      tagline: 'Quiet care, polished details',
      description: 'A calm studio for modern nail care.',
      contactLine: '+1 555 0100 · hello@luma.example',
      address: '12 Rose Street',
      mapStatus: 'Map link ready',
      seoTitle: 'Luma Nail Studio | Appointments',
      seoDescription: 'Book manicures, pedicures, and nail art.'
    })

    expect(
      buildSettingsPreview({
        ...settings,
        name: '',
        tagline: '',
        description: '',
        phone: '',
        email: null,
        address: '',
        mapUrl: null,
        seoTitle: '',
        seoDescription: ''
      })
    ).toEqual({
      profileTitle: 'Studio name',
      tagline: 'No tagline yet',
      description: 'No public description yet.',
      contactLine: 'No contact details yet',
      address: 'No address yet',
      mapStatus: 'No map link',
      seoTitle: 'Search title',
      seoDescription: 'Search description'
    })
  })
})
```

- [ ] **Step 2: Run RED**

Run:

```bash
docker run --rm -v "$PWD":/workspace -w /workspace node:22-bookworm-slim bash -lc 'cd apps/web && node ../../node_modules/vitest/vitest.mjs run tests/admin-settings.test.ts'
```

Expected: fail because `../utils/admin-settings` does not exist.

## Task 2: Settings Helpers

**Files:**
- Create: `apps/web/utils/admin-settings.ts`

- [ ] **Step 1: Implement helpers**

Create `apps/web/utils/admin-settings.ts`:

```ts
export interface SettingsFormLike {
  name: string
  tagline: string
  description: string
  phone: string
  email: string | null
  address: string
  mapUrl: string | null
  seoTitle: string
  seoDescription: string
}

function valueOrFallback(value: string | null | undefined, fallback: string) {
  return value?.trim() || fallback
}

function optionalString(value: string | null | undefined) {
  return value?.trim() || null
}

export function buildSettingsSavePayload(input: SettingsFormLike) {
  return {
    ...input,
    email: optionalString(input.email),
    mapUrl: optionalString(input.mapUrl)
  }
}

export function buildSettingsPreview(input: SettingsFormLike) {
  const contactParts = [input.phone, input.email].map((value) => value?.trim()).filter(Boolean)

  return {
    profileTitle: valueOrFallback(input.name, 'Studio name'),
    tagline: valueOrFallback(input.tagline, 'No tagline yet'),
    description: valueOrFallback(input.description, 'No public description yet.'),
    contactLine: contactParts.length ? contactParts.join(' · ') : 'No contact details yet',
    address: valueOrFallback(input.address, 'No address yet'),
    mapStatus: input.mapUrl?.trim() ? 'Map link ready' : 'No map link',
    seoTitle: valueOrFallback(input.seoTitle, 'Search title'),
    seoDescription: valueOrFallback(input.seoDescription, 'Search description')
  }
}
```

- [ ] **Step 2: Run GREEN**

Run:

```bash
docker run --rm -v "$PWD":/workspace -w /workspace node:22-bookworm-slim bash -lc 'cd apps/web && node ../../node_modules/vitest/vitest.mjs run tests/admin-settings.test.ts'
```

Expected: pass.

## Task 3: Redesign Settings Page

**Files:**
- Modify: `apps/web/pages/admin/settings.vue`

- [ ] **Step 1: Import settings helpers**

Use `buildSettingsSavePayload(form)` in `handleSave()` and `buildSettingsPreview(form)` in a computed preview.

- [ ] **Step 2: Replace layout**

Use `settings-workspace`, `settings-main`, `settings-preview`, `settings-section`, `field-grid`, and a compact `settings-actions` block.

- [ ] **Step 3: Add responsive CSS**

Desktop uses two columns. Below 980px stacks to one column. Below 640px all field grids and actions stack.

## Task 4: Verification

**Files:**
- Verify all modified web files.

- [ ] **Step 1: Run web tests**

```bash
docker run --rm -v "$PWD":/workspace -w /workspace node:22-bookworm-slim bash -lc 'cd apps/web && node ../../node_modules/vitest/vitest.mjs run'
```

- [ ] **Step 2: Run web lint/typecheck**

```bash
docker compose run --rm tooling bun --filter @nailly/web lint
```

- [ ] **Step 3: Run web build**

```bash
docker compose run --rm tooling bun --filter @nailly/web build
```

- [ ] **Step 4: Restart web and smoke route**

```bash
docker compose restart web
sleep 3
curl -sS -I http://localhost:3000/admin/settings
```

Expected: unauthenticated route returns `302 Found` to `/admin/login`.
