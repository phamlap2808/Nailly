# Warm Editorial Product Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the Nailly frontend into a professional Warm Editorial experience across the public landing page, booking flow, and admin dashboard without changing backend contracts.

**Architecture:** Keep the existing Nuxt 3 app and API calls. Add small tested display helpers for booking summaries and admin status styling, then layer the redesign through existing Vue pages/components and a shared CSS token system. Public surfaces prioritize boutique editorial presentation; admin surfaces reuse the same brand language with denser operational layouts.

**Tech Stack:** Nuxt 3, Vue 3, TypeScript, Vitest, Pinia, Nuxt Image, Nuxt Icon, local scoped CSS and global CSS tokens.

---

## Scope Notes

- Do not change Hono API endpoints, database schema, shared backend schemas, or Docker services.
- Keep all existing flows working: public site load, public booking submit, admin login, admin booking status update, services/staff/media/settings management.
- Make mobile responsive behavior part of every UI task, not a final cleanup pass.
- Use TDD for behavior helpers. For CSS/layout-only work, verify through lint/build and responsive browser review.
- Keep `.DS_Store` untracked and unrelated.

## File Structure Map

Create:

- `apps/web/utils/booking-summary.ts`: computes selected services, estimated totals, and booking summary labels for the redesigned booking form.
- `apps/web/tests/booking-summary.test.ts`: Vitest coverage for booking summary helper.
- `apps/web/utils/admin-status.ts`: maps booking statuses to display labels and CSS class names.
- `apps/web/tests/admin-status.test.ts`: Vitest coverage for status display helper.

Modify:

- `apps/web/assets/css/main.css`: Warm Editorial tokens, base typography, shared buttons/forms/admin utilities, responsive constraints.
- `apps/web/components/PublicNav.vue`: refined public navigation and responsive CTA.
- `apps/web/pages/index.vue`: editorial landing page layout.
- `apps/web/components/ServiceCard.vue`: service row/card presentation for public pages.
- `apps/web/components/GalleryGrid.vue`: responsive editorial image rhythm.
- `apps/web/pages/booking.vue`: booking page shell and shop summary.
- `apps/web/components/BookingForm.vue`: grouped booking flow, service cards, summary panel, improved states.
- `apps/web/components/TimeSlotGrid.vue`: stable, tappable time slot grid.
- `apps/web/components/AdminShell.vue`: Warm Editorial admin shell and responsive admin navigation.
- `apps/web/pages/admin/index.vue`: overview metrics polish.
- `apps/web/pages/admin/bookings.vue`: booking filters, status badges, desktop table/mobile cards.
- `apps/web/pages/admin/services.vue`: service management list and modal polish.
- `apps/web/pages/admin/staff.vue`: staff management cards and modal polish.
- `apps/web/pages/admin/media.vue`: upload panel and responsive media grid polish.
- `apps/web/pages/admin/settings.vue`: settings form polish.
- `apps/web/pages/admin/login.vue`: branded login page polish.
- `apps/web/tests/landing-content.test.ts`: keep public display helper coverage aligned with redesigned service price display.
- `apps/web/tests/booking-form.test.ts`: keep payload coverage and add summary behavior through helper tests.
- `apps/web/tests/admin-nav.test.ts`: keep role navigation coverage.

Do not modify:

- `apps/api/**`
- `packages/shared/**`
- Database or Docker configuration.

---

### Task 1: Booking Summary Helper

**Files:**
- Create: `apps/web/utils/booking-summary.ts`
- Create: `apps/web/tests/booking-summary.test.ts`

- [ ] **Step 1: Write failing tests for selected-service summary**

Create `apps/web/tests/booking-summary.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { buildBookingSummary } from '../utils/booking-summary'

const services = [
  { id: 'gel', name: 'Structured Gel Manicure', durationMins: 60, priceCents: 5800 },
  { id: 'art', name: 'Minimal Nail Art', durationMins: 75, priceCents: 7200 },
  { id: 'pedi', name: 'Restorative Pedicure', durationMins: 50, priceCents: 6400 }
]

describe('buildBookingSummary', () => {
  it('summarizes selected services with totals and labels', () => {
    expect(
      buildBookingSummary({
        services,
        selectedServiceIds: ['gel', 'art'],
        appointmentDate: '2026-06-03',
        startTime: '10:30',
        partySize: 2
      })
    ).toEqual({
      selectedServices: [services[0], services[1]],
      serviceLabel: 'Structured Gel Manicure + 1 more',
      durationLabel: '135 min',
      totalPriceCents: 13000,
      dateLabel: '2026-06-03',
      timeLabel: '10:30',
      partyLabel: '2 guests'
    })
  })

  it('uses empty-state labels before the customer has selected details', () => {
    expect(
      buildBookingSummary({
        services,
        selectedServiceIds: [],
        appointmentDate: '',
        startTime: null,
        partySize: 1
      })
    ).toEqual({
      selectedServices: [],
      serviceLabel: 'Choose services',
      durationLabel: 'Select services',
      totalPriceCents: 0,
      dateLabel: 'Choose a date',
      timeLabel: 'Choose a time',
      partyLabel: '1 guest'
    })
  })
})
```

- [ ] **Step 2: Run the test and verify it fails**

Run:

```bash
docker compose run --rm tooling bun --filter @nailly/web test booking-summary
```

Expected: FAIL because `../utils/booking-summary` does not exist.

- [ ] **Step 3: Implement the minimal booking summary helper**

Create `apps/web/utils/booking-summary.ts`:

```ts
interface SummaryService {
  id: string
  name: string
  durationMins: number
  priceCents: number
}

interface BookingSummaryInput {
  services: SummaryService[]
  selectedServiceIds: string[]
  appointmentDate: string
  startTime: string | null
  partySize: number
}

export function buildBookingSummary(input: BookingSummaryInput) {
  const selectedServices = input.selectedServiceIds
    .map((id) => input.services.find((service) => service.id === id))
    .filter((service): service is SummaryService => Boolean(service))

  const totalDuration = selectedServices.reduce((sum, service) => sum + service.durationMins, 0)
  const totalPriceCents = selectedServices.reduce((sum, service) => sum + service.priceCents, 0)
  const remainingCount = selectedServices.length - 1

  return {
    selectedServices,
    serviceLabel: selectedServices.length
      ? `${selectedServices[0].name}${remainingCount > 0 ? ` + ${remainingCount} more` : ''}`
      : 'Choose services',
    durationLabel: totalDuration > 0 ? `${totalDuration} min` : 'Select services',
    totalPriceCents,
    dateLabel: input.appointmentDate || 'Choose a date',
    timeLabel: input.startTime || 'Choose a time',
    partyLabel: `${input.partySize} ${input.partySize === 1 ? 'guest' : 'guests'}`
  }
}
```

- [ ] **Step 4: Run the test and verify it passes**

Run:

```bash
docker compose run --rm tooling bun --filter @nailly/web test booking-summary
```

Expected: PASS for `booking-summary.test.ts`.

- [ ] **Step 5: Commit helper work**

Run:

```bash
git add apps/web/utils/booking-summary.ts apps/web/tests/booking-summary.test.ts
git commit -m "feat: add booking summary helper"
```

---

### Task 2: Admin Status Display Helper

**Files:**
- Create: `apps/web/utils/admin-status.ts`
- Create: `apps/web/tests/admin-status.test.ts`

- [ ] **Step 1: Write failing tests for status labels and classes**

Create `apps/web/tests/admin-status.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { getBookingStatusDisplay } from '../utils/admin-status'

describe('getBookingStatusDisplay', () => {
  it('maps known booking statuses to warm editorial labels and class names', () => {
    expect(getBookingStatusDisplay('pending_confirmation')).toEqual({
      label: 'Pending',
      className: 'status-badge status-badge--pending'
    })
    expect(getBookingStatusDisplay('confirmed')).toEqual({
      label: 'Confirmed',
      className: 'status-badge status-badge--confirmed'
    })
    expect(getBookingStatusDisplay('completed')).toEqual({
      label: 'Completed',
      className: 'status-badge status-badge--completed'
    })
    expect(getBookingStatusDisplay('cancelled')).toEqual({
      label: 'Cancelled',
      className: 'status-badge status-badge--cancelled'
    })
  })

  it('formats unknown statuses without crashing layouts', () => {
    expect(getBookingStatusDisplay('needs_review')).toEqual({
      label: 'Needs review',
      className: 'status-badge'
    })
  })
})
```

- [ ] **Step 2: Run the test and verify it fails**

Run:

```bash
docker compose run --rm tooling bun --filter @nailly/web test admin-status
```

Expected: FAIL because `../utils/admin-status` does not exist.

- [ ] **Step 3: Implement the status display helper**

Create `apps/web/utils/admin-status.ts`:

```ts
const statusMap: Record<string, { label: string; className: string }> = {
  pending_confirmation: {
    label: 'Pending',
    className: 'status-badge status-badge--pending'
  },
  confirmed: {
    label: 'Confirmed',
    className: 'status-badge status-badge--confirmed'
  },
  completed: {
    label: 'Completed',
    className: 'status-badge status-badge--completed'
  },
  cancelled: {
    label: 'Cancelled',
    className: 'status-badge status-badge--cancelled'
  }
}

export function getBookingStatusDisplay(status: string) {
  return statusMap[status] ?? {
    label: status
      .split('_')
      .filter(Boolean)
      .map((part, index) => (index === 0 ? `${part.charAt(0).toUpperCase()}${part.slice(1)}` : part))
      .join(' '),
    className: 'status-badge'
  }
}
```

- [ ] **Step 4: Run the test and verify it passes**

Run:

```bash
docker compose run --rm tooling bun --filter @nailly/web test admin-status
```

Expected: PASS for `admin-status.test.ts`.

- [ ] **Step 5: Commit helper work**

Run:

```bash
git add apps/web/utils/admin-status.ts apps/web/tests/admin-status.test.ts
git commit -m "feat: add admin status display helper"
```

---

### Task 3: Warm Editorial Design Tokens

**Files:**
- Modify: `apps/web/assets/css/main.css`

- [ ] **Step 1: Replace global tokens with Warm Editorial foundations**

Update `apps/web/assets/css/main.css` so `:root` contains this token set and global base:

```css
:root {
  --color-bg: #f8f3ed;
  --color-bg-strong: #efe2d6;
  --color-ink: #2b211d;
  --color-ink-soft: #59463d;
  --color-primary: #7d4e3f;
  --color-primary-hover: #693f33;
  --color-accent: #b8765c;
  --color-muted: #7b6a60;
  --color-border: #dfd0c3;
  --color-surface: #fffaf4;
  --color-surface-strong: #ffffff;
  --color-success: #2f6b43;
  --color-danger: #a6423a;
  --shadow-soft: 0 18px 44px rgba(62, 40, 28, 0.08);
  --radius-card: 8px;
  --radius-media: 18px;
}

*, *::before, *::after {
  box-sizing: border-box;
}

html {
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  background: var(--color-bg);
  color: var(--color-ink);
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
}

body {
  margin: 0;
  line-height: 1.6;
}

button,
input,
select,
textarea {
  font: inherit;
}

:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

.container {
  width: 100%;
  max-width: 1180px;
  margin: 0 auto;
  padding: 0 1.5rem;
}

.eyebrow {
  color: var(--color-accent);
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.display-title {
  font-family: Georgia, "Times New Roman", serif;
  letter-spacing: 0;
  line-height: 0.98;
}

.btn-primary,
.btn-secondary {
  min-height: 2.6rem;
  border-radius: var(--radius-card);
  padding: 0.65rem 1rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.45rem;
  font-weight: 700;
  text-decoration: none;
  cursor: pointer;
  transition: background 0.15s ease, border-color 0.15s ease, color 0.15s ease;
}

.btn-primary {
  border: 1px solid var(--color-primary);
  background: var(--color-primary);
  color: #fff;
}

.btn-primary:hover:not(:disabled) {
  background: var(--color-primary-hover);
  border-color: var(--color-primary-hover);
}

.btn-secondary {
  border: 1px solid var(--color-border);
  background: rgba(255, 250, 244, 0.72);
  color: var(--color-ink-soft);
}

.btn-primary:disabled,
.btn-secondary:disabled {
  cursor: not-allowed;
  opacity: 0.62;
}

@media (max-width: 768px) {
  .container {
    padding: 0 1rem;
  }
}
```

- [ ] **Step 2: Add shared form and admin utility classes**

Append these shared classes to `apps/web/assets/css/main.css`:

```css
.form-control {
  width: 100%;
  min-height: 2.65rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-card);
  background: var(--color-surface-strong);
  color: var(--color-ink);
  padding: 0.65rem 0.75rem;
}

.form-control:focus {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(125, 78, 63, 0.14);
  outline: none;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 1.6rem;
  border-radius: 999px;
  padding: 0.2rem 0.65rem;
  background: #f0e6dc;
  color: var(--color-ink-soft);
  font-size: 0.74rem;
  font-weight: 700;
  white-space: nowrap;
}

.status-badge--pending {
  background: #f5e7d7;
  color: #8a5635;
}

.status-badge--confirmed {
  background: #e6f0e7;
  color: var(--color-success);
}

.status-badge--completed {
  background: #ede9e3;
  color: var(--color-muted);
}

.status-badge--cancelled {
  background: #f7e2df;
  color: var(--color-danger);
}

.surface-panel {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-card);
  background: rgba(255, 250, 244, 0.82);
  box-shadow: var(--shadow-soft);
}
```

- [ ] **Step 3: Run CSS-aware typecheck/build smoke**

Run:

```bash
docker compose run --rm tooling bun --filter @nailly/web lint
```

Expected: exit 0.

- [ ] **Step 4: Commit global styling foundation**

Run:

```bash
git add apps/web/assets/css/main.css
git commit -m "style: add warm editorial design tokens"
```

---

### Task 4: Public Navigation and Landing Page

**Files:**
- Modify: `apps/web/components/PublicNav.vue`
- Modify: `apps/web/pages/index.vue`
- Modify: `apps/web/components/ServiceCard.vue`
- Modify: `apps/web/components/GalleryGrid.vue`
- Modify: `apps/web/tests/landing-content.test.ts`

- [ ] **Step 1: Update the landing content test intent**

Modify `apps/web/tests/landing-content.test.ts` to keep format coverage and assert the display helper still works for service prices:

```ts
import { describe, expect, it } from 'vitest'
import { formatPrice } from '../utils/format'

describe('public landing display helpers', () => {
  it('formats cents as USD for visible service prices', () => {
    expect(formatPrice(5200)).toBe('$52')
    expect(formatPrice(0)).toBe('$0')
  })
})
```

- [ ] **Step 2: Run the landing test**

Run:

```bash
docker compose run --rm tooling bun --filter @nailly/web test landing-content
```

Expected: PASS. This protects an existing display contract before layout changes.

- [ ] **Step 3: Redesign public navigation**

Replace `apps/web/components/PublicNav.vue` with a refined responsive nav:

```vue
<template>
  <header class="public-nav">
    <div class="container nav-inner">
      <NuxtLink to="/" class="logo" aria-label="Luma Nail Studio home">
        <span class="logo-mark">LN</span>
        <span>Luma Nail Studio</span>
      </NuxtLink>
      <nav class="nav-links" aria-label="Public navigation">
        <NuxtLink to="/#services">Services</NuxtLink>
        <NuxtLink to="/#gallery">Gallery</NuxtLink>
        <NuxtLink to="/booking" class="nav-cta">{{ $t('nav.book') }}</NuxtLink>
        <NuxtLink to="/admin/login" class="admin-link">{{ $t('nav.admin') }}</NuxtLink>
      </nav>
    </div>
  </header>
</template>

<style scoped>
.public-nav {
  position: sticky;
  top: 0;
  z-index: 50;
  border-bottom: 1px solid rgba(223, 208, 195, 0.82);
  background: rgba(255, 250, 244, 0.9);
  backdrop-filter: blur(18px);
}

.nav-inner {
  min-height: 4.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.logo {
  display: inline-flex;
  align-items: center;
  gap: 0.65rem;
  color: var(--color-ink);
  font-weight: 800;
  text-decoration: none;
}

.logo-mark {
  width: 2.1rem;
  height: 2.1rem;
  border-radius: 999px;
  display: inline-grid;
  place-items: center;
  background: var(--color-ink);
  color: var(--color-surface);
  font-family: Georgia, "Times New Roman", serif;
  font-size: 0.8rem;
  letter-spacing: 0;
}

.nav-links {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.75rem;
  min-width: 0;
}

.nav-links a {
  color: var(--color-muted);
  text-decoration: none;
  font-size: 0.9rem;
  font-weight: 700;
  white-space: nowrap;
}

.nav-links a:hover {
  color: var(--color-primary);
}

.nav-cta {
  min-height: 2.35rem;
  border-radius: var(--radius-card);
  padding: 0.45rem 0.8rem;
  background: var(--color-primary);
  color: #fff !important;
}

.admin-link {
  opacity: 0.72;
}

@media (max-width: 640px) {
  .nav-inner {
    min-height: auto;
    padding-top: 0.8rem;
    padding-bottom: 0.8rem;
    align-items: flex-start;
    flex-direction: column;
  }

  .nav-links {
    width: 100%;
    display: grid;
    grid-template-columns: repeat(4, minmax(0, auto));
    gap: 0.45rem;
  }

  .nav-links a {
    font-size: 0.78rem;
  }

  .nav-cta {
    justify-content: center;
  }
}
</style>
```

- [ ] **Step 4: Redesign service card component**

Replace `apps/web/components/ServiceCard.vue` with this service row/card:

```vue
<template>
  <article class="service-card">
    <div>
      <h3 class="service-name">{{ service.name }}</h3>
      <p class="service-desc">{{ service.description }}</p>
    </div>
    <div class="service-meta">
      <span>{{ service.durationMins }} min</span>
      <strong>{{ formatPrice(service.priceCents) }}</strong>
    </div>
  </article>
</template>

<script setup lang="ts">
import { formatPrice } from '../utils/format'

defineProps<{
  service: {
    name: string
    description: string
    durationMins: number
    priceCents: number
  }
}>()
</script>

<style scoped>
.service-card {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 1rem;
  align-items: start;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-card);
  background: rgba(255, 250, 244, 0.78);
  padding: 1rem;
}

.service-name {
  margin: 0;
  color: var(--color-ink);
  font-size: 1rem;
  line-height: 1.25;
}

.service-desc {
  margin: 0.35rem 0 0;
  color: var(--color-muted);
  font-size: 0.9rem;
  line-height: 1.5;
}

.service-meta {
  display: grid;
  gap: 0.25rem;
  justify-items: end;
  color: var(--color-muted);
  font-size: 0.85rem;
  white-space: nowrap;
}

.service-meta strong {
  color: var(--color-primary);
  font-size: 1rem;
}

@media (max-width: 520px) {
  .service-card {
    grid-template-columns: 1fr;
  }

  .service-meta {
    display: flex;
    justify-content: space-between;
  }
}
</style>
```

- [ ] **Step 5: Redesign gallery grid**

Replace `apps/web/components/GalleryGrid.vue` with this responsive rhythm:

```vue
<template>
  <div class="gallery-grid">
    <NuxtImg
      v-for="(item, index) in images"
      :key="item.publicUrl"
      :src="item.publicUrl"
      :alt="item.altText ?? ''"
      :class="['gallery-img', { 'gallery-img--feature': index === 0 }]"
      width="520"
      height="420"
      loading="lazy"
    />
  </div>
</template>

<script setup lang="ts">
defineProps<{
  images: Array<{ publicUrl: string; altText: string | null }>
}>()
</script>

<style scoped>
.gallery-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  grid-auto-rows: 220px;
  gap: 1rem;
}

.gallery-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: var(--radius-media);
  background: var(--color-bg-strong);
}

.gallery-img--feature {
  grid-column: span 2;
  grid-row: span 2;
}

@media (max-width: 820px) {
  .gallery-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    grid-auto-rows: 180px;
  }
}

@media (max-width: 560px) {
  .gallery-grid {
    grid-template-columns: 1fr;
    grid-auto-rows: 220px;
  }

  .gallery-img--feature {
    grid-column: auto;
    grid-row: auto;
  }
}
</style>
```

- [ ] **Step 6: Redesign landing page**

Rewrite the template/style of `apps/web/pages/index.vue` around these sections while keeping the existing `useFetch`, `SitePayload`, `whyReasons`, and `useSeoMeta` behavior:

```vue
<template>
  <div>
    <PublicNav />

    <main>
      <section class="hero">
        <div class="container hero-grid">
          <div class="hero-copy">
            <p class="eyebrow">Private nail care</p>
            <h1 class="display-title">{{ site?.shop?.name ?? 'Nail Studio' }}</h1>
            <p class="hero-tagline">
              {{ site?.shop?.tagline || 'Quiet luxury nail care, shaped around your day.' }}
            </p>
            <div class="hero-actions">
              <NuxtLink to="/booking" class="btn-primary">{{ $t('nav.book') }}</NuxtLink>
              <a href="#services" class="btn-secondary">Explore services</a>
            </div>
          </div>
          <div class="hero-visual" :style="heroImageStyle">
            <div class="hero-note">Gel manicure · BIAB · Nail art</div>
          </div>
        </div>
      </section>

      <section v-if="site?.services?.length" id="services" class="container editorial-section services-section">
        <div class="section-intro">
          <p class="eyebrow">Signature services</p>
          <h2 class="display-title">Designed for clean shape, lasting gloss, and careful detail.</h2>
          <p>Browse the services clients book most often, then choose your time in a few focused steps.</p>
        </div>
        <div class="services-list">
          <ServiceCard v-for="svc in site.services" :key="svc.id" :service="svc" />
        </div>
      </section>

      <section class="proof-band">
        <div class="container proof-grid">
          <article v-for="reason in whyReasons" :key="reason.title" class="proof-card">
            <p class="eyebrow">{{ reason.kicker }}</p>
            <h3>{{ reason.title }}</h3>
            <p>{{ reason.text }}</p>
          </article>
        </div>
      </section>

      <section v-if="site?.gallery?.length" id="gallery" class="container editorial-section">
        <div class="section-intro section-intro--wide">
          <p class="eyebrow">Portfolio</p>
          <h2 class="display-title">Soft neutrals, precise lines, and wearable detail.</h2>
        </div>
        <GalleryGrid :images="site.gallery" />
      </section>

      <section v-if="site?.staff?.length || site?.shop" class="container visit-section">
        <div v-if="site?.staff?.length" class="staff-panel surface-panel">
          <p class="eyebrow">Artists</p>
          <h2 class="display-title">A small team with a careful hand.</h2>
          <div class="staff-grid">
            <div v-for="person in site.staff" :key="person.id" class="staff-card">
              <strong>{{ person.name }}</strong>
              <span>{{ person.title }}</span>
            </div>
          </div>
        </div>
        <div v-if="site?.shop" class="visit-panel surface-panel">
          <p class="eyebrow">Visit us</p>
          <h2>{{ site.shop.name }}</h2>
          <p>{{ site.shop.address }}</p>
          <p>{{ site.shop.phone }}</p>
          <NuxtLink to="/booking" class="btn-primary">{{ $t('nav.book') }}</NuxtLink>
        </div>
      </section>
    </main>

    <footer class="footer">
      <div class="container footer-content">
        <span>{{ site?.shop?.name ?? 'Nail Studio' }}</span>
      </div>
    </footer>
  </div>
</template>
```

Add this script update inside the existing `<script setup>`:

```ts
const whyReasons = [
  { kicker: 'Care', title: 'Expert Technicians', text: 'Our nail artists bring years of specialized training and experience to every appointment.' },
  { kicker: 'Materials', title: 'Premium Products', text: 'We use top-quality polishes, gels, and treatments for lasting results and healthy nails.' },
  { kicker: 'Hygiene', title: 'Hygienic Standards', text: 'All tools are sterilized and stations sanitized between each client.' }
]

const heroImageStyle = computed(() => {
  const image = site.value?.gallery?.[0]?.publicUrl
  return image ? { backgroundImage: `linear-gradient(rgba(43, 33, 29, 0.08), rgba(43, 33, 29, 0.18)), url("${image}")` } : {}
})
```

Add page CSS matching the mockup:

```css
.hero {
  min-height: calc(100vh - 4.5rem);
  padding: 4.5rem 0 3rem;
  background: radial-gradient(circle at top left, rgba(184, 118, 92, 0.18), transparent 36%), var(--color-bg);
}

.hero-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(320px, 0.82fr);
  gap: 3rem;
  align-items: center;
}

.hero-copy h1 {
  max-width: 680px;
  margin: 0.5rem 0 0;
  font-size: clamp(3rem, 8vw, 6.7rem);
}

.hero-tagline {
  max-width: 540px;
  margin: 1.2rem 0 0;
  color: var(--color-ink-soft);
  font-size: 1.1rem;
}

.hero-actions {
  display: flex;
  gap: 0.8rem;
  flex-wrap: wrap;
  margin-top: 1.8rem;
}

.hero-visual {
  min-height: 470px;
  position: relative;
  border-radius: var(--radius-media);
  background: linear-gradient(135deg, #d9c3b3, #a66c58 48%, #ead9ca);
  background-position: center;
  background-size: cover;
  box-shadow: var(--shadow-soft);
  overflow: hidden;
}

.hero-note {
  position: absolute;
  left: 1rem;
  right: 1rem;
  bottom: 1rem;
  border-radius: var(--radius-card);
  background: rgba(43, 33, 29, 0.74);
  color: #fff8ef;
  padding: 0.9rem 1rem;
  font-weight: 700;
}

.editorial-section {
  padding: 4.5rem 1.5rem;
}

.services-section {
  display: grid;
  grid-template-columns: minmax(0, 0.85fr) minmax(0, 1.15fr);
  gap: 3rem;
  align-items: start;
}

.section-intro h2 {
  margin: 0.4rem 0 0;
  font-size: clamp(2rem, 4vw, 3.6rem);
}

.section-intro p:not(.eyebrow) {
  color: var(--color-muted);
}

.services-list {
  display: grid;
  gap: 0.8rem;
}

.proof-band {
  padding: 3.5rem 0;
  background: var(--color-bg-strong);
}

.proof-grid,
.staff-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1rem;
}

.proof-card,
.staff-card {
  border: 1px solid rgba(125, 78, 63, 0.16);
  border-radius: var(--radius-card);
  background: rgba(255, 250, 244, 0.7);
  padding: 1.2rem;
}

.proof-card h3 {
  margin: 0.35rem 0;
}

.proof-card p:last-child,
.staff-card span,
.visit-panel p {
  color: var(--color-muted);
}

.visit-section {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 340px;
  gap: 1rem;
  padding-bottom: 4.5rem;
}

.staff-panel,
.visit-panel {
  padding: 1.4rem;
}

.staff-panel h2 {
  margin: 0.3rem 0 1rem;
}

.staff-card strong,
.staff-card span {
  display: block;
}

.visit-panel h2 {
  margin: 0.35rem 0 0.8rem;
}

.visit-panel .btn-primary {
  margin-top: 1rem;
}

.footer {
  border-top: 1px solid var(--color-border);
  background: var(--color-surface);
  padding: 1.5rem 0;
}

.footer-content {
  color: var(--color-muted);
  font-size: 0.85rem;
}

@media (max-width: 880px) {
  .hero {
    min-height: auto;
    padding-top: 3rem;
  }

  .hero-grid,
  .services-section,
  .visit-section {
    grid-template-columns: 1fr;
  }

  .hero-visual {
    min-height: 340px;
  }

  .proof-grid,
  .staff-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 560px) {
  .editorial-section {
    padding: 3rem 1rem;
  }

  .hero-copy h1 {
    font-size: 3rem;
  }
}
```

- [ ] **Step 7: Run public-surface verification**

Run:

```bash
docker compose run --rm tooling bun --filter @nailly/web test landing-content
docker compose run --rm tooling bun --filter @nailly/web lint
```

Expected: both commands exit 0.

- [ ] **Step 8: Commit public redesign**

Run:

```bash
git add apps/web/components/PublicNav.vue apps/web/pages/index.vue apps/web/components/ServiceCard.vue apps/web/components/GalleryGrid.vue apps/web/tests/landing-content.test.ts
git commit -m "style: redesign public salon site"
```

---

### Task 5: Booking Flow Redesign

**Files:**
- Modify: `apps/web/pages/booking.vue`
- Modify: `apps/web/components/BookingForm.vue`
- Modify: `apps/web/components/TimeSlotGrid.vue`
- Modify: `apps/web/tests/booking-form.test.ts`

- [ ] **Step 1: Keep booking payload test green before UI changes**

Run:

```bash
docker compose run --rm tooling bun --filter @nailly/web test booking-form booking-summary
```

Expected: PASS for existing payload behavior and new summary helper.

- [ ] **Step 2: Redesign time slot grid**

Replace `apps/web/components/TimeSlotGrid.vue` template/style with stable buttons:

```vue
<template>
  <div class="slot-grid" aria-live="polite">
    <div v-if="loading" class="slot-state">Loading available times...</div>
    <template v-else>
      <button
        v-for="slot in slots"
        :key="slot"
        type="button"
        :class="['slot-chip', { selected: modelValue === slot, unavailable: unavailableSlots.has(slot) }]"
        :disabled="unavailableSlots.has(slot)"
        @click="$emit('update:modelValue', slot)"
      >
        {{ slot }}
      </button>
      <div v-if="!slots.length" class="slot-state">No time slots available for this date.</div>
    </template>
  </div>
</template>
```

Use this style:

```css
.slot-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(88px, 1fr));
  gap: 0.55rem;
}

.slot-chip {
  min-height: 2.6rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-card);
  background: var(--color-surface-strong);
  color: var(--color-ink);
  font-size: 0.9rem;
  font-weight: 700;
  cursor: pointer;
  transition: border-color 0.15s ease, color 0.15s ease, background 0.15s ease;
}

.slot-chip:hover:not(:disabled) {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.slot-chip.selected {
  background: var(--color-primary);
  color: #fff;
  border-color: var(--color-primary);
}

.slot-chip.unavailable {
  opacity: 0.35;
  cursor: not-allowed;
  text-decoration: line-through;
}

.slot-state {
  grid-column: 1 / -1;
  border: 1px dashed var(--color-border);
  border-radius: var(--radius-card);
  color: var(--color-muted);
  font-size: 0.9rem;
  padding: 0.9rem;
}

@media (max-width: 520px) {
  .slot-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
```

- [ ] **Step 3: Redesign booking page shell**

Update `apps/web/pages/booking.vue` template:

```vue
<template>
  <div>
    <PublicNav />
    <main class="booking-page">
      <section class="container booking-hero">
        <p class="eyebrow">Appointments</p>
        <h1 class="display-title">{{ $t('booking.title') }}</h1>
        <p>Choose your services, find a time, and send a request. The salon will contact you to confirm.</p>
      </section>

      <section class="container booking-content">
        <div v-if="!site" class="loading-state surface-panel">Loading appointment details...</div>
        <BookingForm
          v-else
          :services="site.services ?? []"
          :staff="site.staff ?? []"
          :shop="site.shop"
        />
      </section>
    </main>
  </div>
</template>
```

Update the fetched type to pass `shop` into `BookingForm`:

```ts
const { data: site } = await useFetch<{
  shop: { name: string; address: string; phone: string } | null
  services: Array<{ id: string; name: string; durationMins: number; priceCents: number }>
  staff: Array<{ id: string; name: string }>
}>(`${config.public.apiBaseUrl}/public/site`)
```

Use this page style:

```css
.booking-page {
  min-height: 100vh;
  background: radial-gradient(circle at top left, rgba(184, 118, 92, 0.16), transparent 34%), var(--color-bg);
}

.booking-hero {
  padding: 3.5rem 1.5rem 1.5rem;
}

.booking-hero h1 {
  margin: 0.4rem 0 0;
  font-size: clamp(2.6rem, 7vw, 5rem);
}

.booking-hero p:not(.eyebrow) {
  max-width: 620px;
  color: var(--color-muted);
  font-size: 1rem;
}

.booking-content {
  padding-bottom: 4rem;
}

.loading-state {
  padding: 2rem;
  color: var(--color-muted);
}
```

- [ ] **Step 4: Redesign BookingForm props and computed summary**

In `apps/web/components/BookingForm.vue`, update imports and props:

```ts
import { formatPrice } from '../utils/format'
import { buildBookingPayload } from '../utils/booking-payload'
import { buildBookingSummary } from '../utils/booking-summary'
import type { CreateBookingInput } from '@nailly/shared'

const props = defineProps<{
  services: Array<{ id: string; name: string; durationMins: number; priceCents: number }>
  staff: Array<{ id: string; name: string }>
  shop: { name: string; address: string; phone: string } | null
}>()

const summary = computed(() =>
  buildBookingSummary({
    services: props.services,
    selectedServiceIds: form.serviceIds,
    appointmentDate: form.appointmentDate,
    startTime: form.startTime,
    partySize: form.partySize
  })
)
```

- [ ] **Step 5: Replace BookingForm template with grouped form and summary**

Replace the `<template>` in `BookingForm.vue` with:

```vue
<template>
  <div class="booking-layout">
    <form class="booking-form surface-panel" @submit.prevent="handleSubmit">
      <div v-if="success" class="form-success">{{ $t('booking.success') }}</div>
      <div v-if="error" class="form-error">{{ error }}</div>

      <div v-if="!success" class="form-fields">
        <section class="form-section">
          <div class="section-heading">
            <span>1</span>
            <div>
              <p class="eyebrow">Services</p>
              <h2>Choose your treatment</h2>
            </div>
          </div>
          <div class="service-options">
            <label
              v-for="svc in services"
              :key="svc.id"
              :class="['service-option', { selected: form.serviceIds.includes(svc.id) }]"
            >
              <input
                type="checkbox"
                :value="svc.id"
                :checked="form.serviceIds.includes(svc.id)"
                @change="toggleService(svc.id)"
              />
              <span>
                <strong>{{ svc.name }}</strong>
                <small>{{ svc.durationMins }} min · {{ formatPrice(svc.priceCents) }}</small>
              </span>
            </label>
          </div>
        </section>

        <section class="form-section">
          <div class="section-heading">
            <span>2</span>
            <div>
              <p class="eyebrow">Schedule</p>
              <h2>Pick a time</h2>
            </div>
          </div>
          <div class="field-grid">
            <label class="field">
              <span>Date *</span>
              <input v-model="form.appointmentDate" class="form-control" type="date" required :min="today" />
            </label>
            <label class="field">
              <span>Preferred staff</span>
              <select v-model="form.staffId" class="form-control">
                <option :value="null">Any available</option>
                <option v-for="s in staff" :key="s.id" :value="s.id">{{ s.name }}</option>
              </select>
            </label>
          </div>
          <div class="field">
            <span>Time *</span>
            <TimeSlotGrid
              v-model="form.startTime"
              :slots="availableSlots"
              :unavailable-slots="new Set()"
              :loading="loadingSlots"
            />
          </div>
        </section>

        <section class="form-section">
          <div class="section-heading">
            <span>3</span>
            <div>
              <p class="eyebrow">Details</p>
              <h2>How can we reach you?</h2>
            </div>
          </div>
          <div class="field-grid">
            <label class="field">
              <span>Name *</span>
              <input v-model="form.customerName" class="form-control" type="text" required placeholder="Your full name" />
            </label>
            <label class="field">
              <span>Phone *</span>
              <input v-model="form.phone" class="form-control" type="tel" required placeholder="+1 555 0100" />
            </label>
            <label class="field">
              <span>Email</span>
              <input v-model="form.email" class="form-control" type="email" placeholder="Optional" />
            </label>
            <label class="field">
              <span>Party size</span>
              <select v-model.number="form.partySize" class="form-control">
                <option v-for="n in 6" :key="n" :value="n">{{ n }}</option>
              </select>
            </label>
          </div>
          <label class="field">
            <span>Note</span>
            <textarea v-model="form.note" class="form-control" rows="3" placeholder="Any special requests..." />
          </label>
        </section>

        <button type="submit" class="btn-primary submit-btn" :disabled="submitting">
          {{ submitting ? 'Submitting...' : $t('booking.submit') }}
        </button>
      </div>
    </form>

    <aside class="booking-summary surface-panel">
      <p class="eyebrow">Your visit</p>
      <h2>{{ summary.serviceLabel }}</h2>
      <dl>
        <div><dt>Duration</dt><dd>{{ summary.durationLabel }}</dd></div>
        <div><dt>Date</dt><dd>{{ summary.dateLabel }}</dd></div>
        <div><dt>Time</dt><dd>{{ summary.timeLabel }}</dd></div>
        <div><dt>Party</dt><dd>{{ summary.partyLabel }}</dd></div>
        <div><dt>Total</dt><dd>{{ formatPrice(summary.totalPriceCents) }}</dd></div>
      </dl>
      <div v-if="shop" class="shop-summary">
        <strong>{{ shop.name }}</strong>
        <span v-if="shop.address">{{ shop.address }}</span>
        <span v-if="shop.phone">{{ shop.phone }}</span>
      </div>
    </aside>
  </div>
</template>
```

- [ ] **Step 6: Add BookingForm responsive styles**

Replace the `<style scoped>` in `BookingForm.vue` with CSS that supports desktop summary and mobile single column:

```css
.booking-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 320px;
  gap: 1.25rem;
  align-items: start;
}

.booking-form,
.booking-summary {
  padding: 1.25rem;
}

.booking-summary {
  position: sticky;
  top: 6rem;
}

.booking-summary h2 {
  margin: 0.35rem 0 1rem;
  font-family: Georgia, "Times New Roman", serif;
  line-height: 1.1;
}

.booking-summary dl {
  display: grid;
  gap: 0.75rem;
  margin: 0;
}

.booking-summary dl div {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  border-bottom: 1px solid rgba(223, 208, 195, 0.72);
  padding-bottom: 0.65rem;
}

.booking-summary dt {
  color: var(--color-muted);
}

.booking-summary dd {
  margin: 0;
  color: var(--color-ink);
  font-weight: 700;
  text-align: right;
}

.shop-summary {
  display: grid;
  gap: 0.25rem;
  margin-top: 1rem;
  color: var(--color-muted);
  font-size: 0.9rem;
}

.shop-summary strong {
  color: var(--color-ink);
}

.form-success,
.form-error {
  border-radius: var(--radius-card);
  padding: 1rem;
  font-size: 0.95rem;
}

.form-success {
  color: var(--color-success);
  background: #edf7ef;
  border: 1px solid #c9e5cf;
}

.form-error {
  color: var(--color-danger);
  background: #fbebe8;
  border: 1px solid #efcac5;
  margin-bottom: 1rem;
}

.form-fields,
.form-section {
  display: grid;
  gap: 1.25rem;
}

.form-section {
  border-bottom: 1px solid rgba(223, 208, 195, 0.72);
  padding-bottom: 1.25rem;
}

.section-heading {
  display: flex;
  gap: 0.8rem;
  align-items: flex-start;
}

.section-heading > span {
  width: 2rem;
  height: 2rem;
  border-radius: 999px;
  display: inline-grid;
  place-items: center;
  flex: 0 0 auto;
  background: var(--color-bg-strong);
  color: var(--color-primary);
  font-weight: 800;
}

.section-heading h2 {
  margin: 0.15rem 0 0;
  font-size: 1.25rem;
  line-height: 1.2;
}

.service-options {
  display: grid;
  gap: 0.7rem;
}

.service-option {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 0.75rem;
  align-items: center;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-card);
  background: var(--color-surface-strong);
  padding: 0.9rem;
  cursor: pointer;
}

.service-option.selected {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(125, 78, 63, 0.12);
}

.service-option input {
  width: 1.1rem;
  height: 1.1rem;
  accent-color: var(--color-primary);
}

.service-option strong,
.service-option small {
  display: block;
}

.service-option small {
  color: var(--color-muted);
}

.field-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.9rem;
}

.field {
  display: grid;
  gap: 0.35rem;
}

.field span {
  color: var(--color-ink-soft);
  font-size: 0.85rem;
  font-weight: 700;
}

.submit-btn {
  justify-self: start;
}

@media (max-width: 860px) {
  .booking-layout {
    grid-template-columns: 1fr;
  }

  .booking-summary {
    position: static;
    order: 2;
  }
}

@media (max-width: 560px) {
  .field-grid {
    grid-template-columns: 1fr;
  }

  .submit-btn {
    width: 100%;
  }
}
```

- [ ] **Step 7: Run booking verification**

Run:

```bash
docker compose run --rm tooling bun --filter @nailly/web test booking-form booking-summary
docker compose run --rm tooling bun --filter @nailly/web lint
```

Expected: both commands exit 0.

- [ ] **Step 8: Commit booking redesign**

Run:

```bash
git add apps/web/pages/booking.vue apps/web/components/BookingForm.vue apps/web/components/TimeSlotGrid.vue apps/web/tests/booking-form.test.ts
git commit -m "style: redesign booking flow"
```

---

### Task 6: Admin Shell and Overview

**Files:**
- Modify: `apps/web/components/AdminShell.vue`
- Modify: `apps/web/pages/admin/index.vue`
- Modify: `apps/web/tests/admin-nav.test.ts`

- [ ] **Step 1: Verify admin nav role tests before shell changes**

Run:

```bash
docker compose run --rm tooling bun --filter @nailly/web test admin-nav
```

Expected: PASS.

- [ ] **Step 2: Redesign AdminShell template**

Replace `apps/web/components/AdminShell.vue` template with:

```vue
<template>
  <div class="admin-shell">
    <aside class="admin-sidebar">
      <NuxtLink to="/admin" class="sidebar-brand">
        <span class="brand-mark">LN</span>
        <span>Luma Nail Studio</span>
      </NuxtLink>
      <nav class="sidebar-nav" aria-label="Admin navigation">
        <NuxtLink
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          class="sidebar-link"
          active-class="sidebar-link--active"
        >
          <span class="link-dot" />
          {{ item.label }}
        </NuxtLink>
      </nav>
      <div class="sidebar-footer">
        <div>
          <div class="sidebar-user">{{ session.user?.name }}</div>
          <div class="sidebar-role">{{ session.user?.role }}</div>
        </div>
        <button class="logout-btn" @click="handleLogout">Log out</button>
      </div>
    </aside>
    <main class="admin-main">
      <slot />
    </main>
  </div>
</template>
```

- [ ] **Step 3: Redesign AdminShell styles**

Use this scoped CSS:

```css
.admin-shell {
  display: grid;
  grid-template-columns: 250px minmax(0, 1fr);
  min-height: 100vh;
  background: var(--color-bg);
}

.admin-sidebar {
  position: sticky;
  top: 0;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--color-ink);
  color: var(--color-surface);
  padding: 1rem;
}

.sidebar-brand {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  color: #fff8ef;
  text-decoration: none;
  font-family: Georgia, "Times New Roman", serif;
  font-size: 1.15rem;
  line-height: 1.1;
  padding: 0.35rem 0.35rem 1rem;
  border-bottom: 1px solid rgba(255, 250, 244, 0.1);
}

.brand-mark {
  width: 2rem;
  height: 2rem;
  border-radius: 999px;
  display: inline-grid;
  place-items: center;
  background: #fff8ef;
  color: var(--color-ink);
  font-size: 0.75rem;
}

.sidebar-nav {
  display: grid;
  gap: 0.35rem;
  padding: 1rem 0;
  flex: 1;
}

.sidebar-link {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  border-radius: var(--radius-card);
  color: rgba(255, 248, 239, 0.68);
  text-decoration: none;
  padding: 0.65rem 0.75rem;
  font-size: 0.9rem;
  font-weight: 700;
}

.sidebar-link:hover,
.sidebar-link--active {
  color: #fff;
  background: var(--color-primary);
}

.link-dot {
  width: 0.4rem;
  height: 0.4rem;
  border-radius: 999px;
  background: currentColor;
}

.sidebar-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  border-top: 1px solid rgba(255, 250, 244, 0.1);
  padding-top: 1rem;
}

.sidebar-user {
  font-weight: 800;
}

.sidebar-role {
  color: rgba(255, 248, 239, 0.55);
  text-transform: capitalize;
  font-size: 0.78rem;
}

.logout-btn {
  border: 1px solid rgba(255, 248, 239, 0.22);
  border-radius: var(--radius-card);
  background: transparent;
  color: rgba(255, 248, 239, 0.78);
  padding: 0.45rem 0.65rem;
  cursor: pointer;
}

.admin-main {
  min-width: 0;
  padding: 2rem;
}

@media (max-width: 820px) {
  .admin-shell {
    grid-template-columns: 1fr;
  }

  .admin-sidebar {
    position: static;
    height: auto;
  }

  .sidebar-nav {
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  }

  .admin-main {
    padding: 1rem;
  }
}
```

- [ ] **Step 4: Redesign admin overview**

Update `apps/web/pages/admin/index.vue` template:

```vue
<template>
  <AdminShell>
    <div class="admin-page-header">
      <div>
        <p class="eyebrow">Dashboard</p>
        <h1 class="display-title">Overview</h1>
        <p>Quick read on booking volume and the catalog powering the public site.</p>
      </div>
    </div>

    <div class="overview-cards">
      <div class="stat-card surface-panel">
        <span>Total bookings</span>
        <strong>{{ stats.bookings ?? '-' }}</strong>
      </div>
      <div class="stat-card surface-panel">
        <span>Services</span>
        <strong>{{ stats.services ?? '-' }}</strong>
      </div>
      <div class="stat-card surface-panel">
        <span>Staff</span>
        <strong>{{ stats.staff ?? '-' }}</strong>
      </div>
    </div>
  </AdminShell>
</template>
```

Use this page CSS:

```css
.admin-page-header {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.25rem;
}

.admin-page-header h1 {
  margin: 0.3rem 0 0;
  font-size: clamp(2rem, 5vw, 3.4rem);
}

.admin-page-header p:not(.eyebrow) {
  color: var(--color-muted);
  margin: 0.4rem 0 0;
}

.overview-cards {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1rem;
}

.stat-card {
  padding: 1.25rem;
}

.stat-card span {
  color: var(--color-muted);
  font-size: 0.78rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.stat-card strong {
  display: block;
  margin-top: 0.75rem;
  color: var(--color-primary);
  font-size: 2.4rem;
  line-height: 1;
}

@media (max-width: 760px) {
  .overview-cards {
    grid-template-columns: 1fr;
  }
}
```

- [ ] **Step 5: Run admin shell verification**

Run:

```bash
docker compose run --rm tooling bun --filter @nailly/web test admin-nav
docker compose run --rm tooling bun --filter @nailly/web lint
```

Expected: both commands exit 0.

- [ ] **Step 6: Commit admin shell and overview**

Run:

```bash
git add apps/web/components/AdminShell.vue apps/web/pages/admin/index.vue apps/web/tests/admin-nav.test.ts
git commit -m "style: redesign admin shell and overview"
```

---

### Task 7: Admin Bookings Page

**Files:**
- Modify: `apps/web/pages/admin/bookings.vue`
- Use: `apps/web/utils/admin-status.ts`

- [ ] **Step 1: Verify status helper before page changes**

Run:

```bash
docker compose run --rm tooling bun --filter @nailly/web test admin-status
```

Expected: PASS.

- [ ] **Step 2: Import status helper**

Add this import to `apps/web/pages/admin/bookings.vue`:

```ts
import { getBookingStatusDisplay } from '../../utils/admin-status'
```

- [ ] **Step 3: Replace bookings template with responsive desktop/mobile rendering**

Replace the page template with:

```vue
<template>
  <AdminShell>
    <div class="admin-page-header">
      <div>
        <p class="eyebrow">Operations</p>
        <h1 class="display-title">Bookings</h1>
        <p>Review requests, confirm appointments, and keep the salon day tidy.</p>
      </div>
      <select v-model="statusFilter" class="filter-select form-control">
        <option value="">All bookings</option>
        <option value="pending_confirmation">Pending</option>
        <option value="confirmed">Confirmed</option>
        <option value="completed">Completed</option>
        <option value="cancelled">Cancelled</option>
      </select>
    </div>

    <div v-if="loading" class="loading-state surface-panel">Loading bookings...</div>
    <div v-else-if="!bookings.length" class="empty-state surface-panel">No bookings found.</div>

    <div v-else class="bookings-panel surface-panel">
      <table class="data-table">
        <thead>
          <tr>
            <th>Customer</th>
            <th>Date</th>
            <th>Time</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="b in bookings" :key="b.id">
            <td>
              <strong>{{ b.customerName }}</strong>
              <span v-if="b.phone">{{ b.phone }}</span>
            </td>
            <td>{{ b.appointmentDate }}</td>
            <td>{{ b.startTime }}</td>
            <td><span :class="getBookingStatusDisplay(b.status).className">{{ getBookingStatusDisplay(b.status).label }}</span></td>
            <td>
              <select
                v-if="b.status === 'pending_confirmation' || b.status === 'confirmed'"
                class="status-action form-control"
                @change="(e) => handleStatusChange(b.id, (e.target as HTMLSelectElement).value)"
              >
                <option value="">Update...</option>
                <option value="confirmed">Confirm</option>
                <option value="completed">Complete</option>
                <option value="cancelled">Cancel</option>
              </select>
            </td>
          </tr>
        </tbody>
      </table>

      <div class="booking-cards">
        <article v-for="b in bookings" :key="`card-${b.id}`" class="booking-card">
          <div>
            <strong>{{ b.customerName }}</strong>
            <span>{{ b.appointmentDate }} at {{ b.startTime }}</span>
          </div>
          <span :class="getBookingStatusDisplay(b.status).className">{{ getBookingStatusDisplay(b.status).label }}</span>
          <select
            v-if="b.status === 'pending_confirmation' || b.status === 'confirmed'"
            class="status-action form-control"
            @change="(e) => handleStatusChange(b.id, (e.target as HTMLSelectElement).value)"
          >
            <option value="">Update...</option>
            <option value="confirmed">Confirm</option>
            <option value="completed">Complete</option>
            <option value="cancelled">Cancel</option>
          </select>
        </article>
      </div>
    </div>
  </AdminShell>
</template>
```

- [ ] **Step 4: Replace bookings styles**

Use this scoped CSS:

```css
.admin-page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.25rem;
}

.admin-page-header h1 {
  margin: 0.3rem 0 0;
  font-size: clamp(2rem, 5vw, 3.4rem);
}

.admin-page-header p:not(.eyebrow) {
  color: var(--color-muted);
  margin: 0.4rem 0 0;
}

.filter-select {
  max-width: 210px;
}

.bookings-panel {
  overflow: hidden;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
}

.data-table th,
.data-table td {
  border-bottom: 1px solid var(--color-border);
  padding: 0.85rem 1rem;
  text-align: left;
  vertical-align: middle;
}

.data-table th {
  background: rgba(239, 226, 214, 0.55);
  color: var(--color-muted);
  font-size: 0.75rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.data-table td strong,
.data-table td span {
  display: block;
}

.data-table td span:not(.status-badge) {
  color: var(--color-muted);
  font-size: 0.82rem;
}

.status-action {
  min-height: 2.25rem;
  padding: 0.4rem 0.55rem;
}

.booking-cards {
  display: none;
}

.loading-state,
.empty-state {
  padding: 2rem;
  color: var(--color-muted);
}

@media (max-width: 760px) {
  .admin-page-header {
    display: grid;
  }

  .filter-select {
    max-width: none;
  }

  .data-table {
    display: none;
  }

  .booking-cards {
    display: grid;
    gap: 0.75rem;
    padding: 0.75rem;
  }

  .booking-card {
    display: grid;
    gap: 0.75rem;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-card);
    background: var(--color-surface-strong);
    padding: 1rem;
  }

  .booking-card strong,
  .booking-card span {
    display: block;
  }

  .booking-card div > span {
    color: var(--color-muted);
  }
}
```

- [ ] **Step 5: Run bookings verification**

Run:

```bash
docker compose run --rm tooling bun --filter @nailly/web test admin-status
docker compose run --rm tooling bun --filter @nailly/web lint
```

Expected: both commands exit 0.

- [ ] **Step 6: Commit bookings redesign**

Run:

```bash
git add apps/web/pages/admin/bookings.vue
git commit -m "style: redesign admin bookings"
```

---

### Task 8: Admin Management Pages

**Files:**
- Modify: `apps/web/pages/admin/services.vue`
- Modify: `apps/web/pages/admin/staff.vue`
- Modify: `apps/web/pages/admin/media.vue`
- Modify: `apps/web/pages/admin/settings.vue`

- [ ] **Step 1: Redesign admin services page**

Update `apps/web/pages/admin/services.vue`:

- Page header should use `.admin-page-header`, `.display-title`, and `.eyebrow`.
- The add button should use `class="btn-primary"`.
- Category groups should use `class="surface-panel category-panel"`.
- Service rows should use stable two-column layout on desktop and one-column on mobile.
- Modal inputs should use `class="form-control"`.
- Modal actions should use `.btn-secondary` and `.btn-primary`.

Use these CSS blocks as the target structure:

```css
.admin-page-header {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.25rem;
}

.admin-page-header h1 {
  margin: 0.3rem 0 0;
  font-size: clamp(2rem, 5vw, 3.4rem);
}

.category-panel {
  padding: 1rem;
  margin-bottom: 1rem;
}

.category-name {
  color: var(--color-muted);
  font-size: 0.78rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  margin: 0 0 0.75rem;
}

.service-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 1rem;
  align-items: center;
  border-top: 1px solid var(--color-border);
  padding: 0.9rem 0;
}

.service-row:first-child {
  border-top: none;
}

.modal-card {
  background: var(--color-surface);
  border-radius: var(--radius-card);
  padding: 1.5rem;
  width: min(100%, 520px);
}

@media (max-width: 640px) {
  .admin-page-header,
  .service-row {
    grid-template-columns: 1fr;
    display: grid;
  }
}
```

- [ ] **Step 2: Redesign admin staff page**

Update `apps/web/pages/admin/staff.vue`:

- Header follows the same pattern as services.
- Staff cards use `.surface-panel`.
- Edit buttons use `.btn-secondary`.
- Modal fields use `.form-control`.
- Service checkbox list remains functional but gets readable spacing.

Use this staff card CSS:

```css
.staff-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 1rem;
}

.staff-card {
  padding: 1.2rem;
}

.staff-name {
  color: var(--color-ink);
  font-weight: 800;
}

.staff-title {
  color: var(--color-muted);
  margin: 0.25rem 0 1rem;
}

.checkbox-label {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  padding: 0.25rem 0;
}
```

- [ ] **Step 3: Redesign admin media page**

Update `apps/web/pages/admin/media.vue`:

- Header follows admin page pattern.
- Upload form uses `.surface-panel upload-form`.
- Inputs/select/button use `.form-control` and `.btn-primary`.
- Media cards use stable image aspect ratio.

Use this media CSS:

```css
.upload-form {
  padding: 1rem;
  margin-bottom: 1.25rem;
}

.upload-row {
  display: grid;
  grid-template-columns: minmax(220px, 1fr) minmax(180px, 1fr) 150px auto;
  gap: 0.75rem;
  align-items: center;
}

.media-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 1rem;
}

.media-card {
  overflow: hidden;
}

.media-img {
  width: 100%;
  aspect-ratio: 4 / 3;
  height: auto;
  object-fit: cover;
  display: block;
}

.media-meta {
  display: grid;
  gap: 0.5rem;
  padding: 0.75rem;
}

@media (max-width: 760px) {
  .upload-row {
    grid-template-columns: 1fr;
  }
}
```

- [ ] **Step 4: Redesign admin settings page**

Update `apps/web/pages/admin/settings.vue`:

- Header follows admin page pattern.
- Form uses `.surface-panel settings-form`.
- Inputs use `.form-control`.
- Submit button uses `.btn-primary`.

Use this settings CSS:

```css
.settings-form {
  display: grid;
  gap: 1rem;
  max-width: 680px;
  padding: 1.25rem;
}

.field {
  display: grid;
  gap: 0.35rem;
}

.field span {
  color: var(--color-ink-soft);
  font-size: 0.85rem;
  font-weight: 700;
}

.settings-form .btn-primary {
  justify-self: start;
}

@media (max-width: 560px) {
  .settings-form .btn-primary {
    width: 100%;
  }
}
```

- [ ] **Step 5: Run management page verification**

Run:

```bash
docker compose run --rm tooling bun --filter @nailly/web lint
```

Expected: exit 0.

- [ ] **Step 6: Commit management page redesign**

Run:

```bash
git add apps/web/pages/admin/services.vue apps/web/pages/admin/staff.vue apps/web/pages/admin/media.vue apps/web/pages/admin/settings.vue
git commit -m "style: redesign admin management pages"
```

---

### Task 9: Admin Login Page

**Files:**
- Modify: `apps/web/pages/admin/login.vue`

- [ ] **Step 1: Redesign login template copy hierarchy**

Keep the existing login logic. Replace the form heading area with:

```vue
<div class="login-heading">
  <p class="eyebrow">Studio operations</p>
  <h1 class="display-title">{{ $t('admin.login') }}</h1>
  <p>Sign in to manage appointments, services, staff, media, and shop settings.</p>
</div>
```

- [ ] **Step 2: Apply Warm Editorial login styles**

Replace login scoped CSS with:

```css
.login-page {
  min-height: 100vh;
  display: grid;
  place-items: center;
  background: radial-gradient(circle at top left, rgba(184, 118, 92, 0.2), transparent 34%), var(--color-bg);
  padding: 1.5rem;
}

.login-card {
  width: min(100%, 430px);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-card);
  background: rgba(255, 250, 244, 0.88);
  box-shadow: var(--shadow-soft);
  padding: 1.5rem;
}

.login-heading h1 {
  margin: 0.3rem 0 0;
  font-size: 2.5rem;
}

.login-heading p:not(.eyebrow) {
  color: var(--color-muted);
  margin: 0.6rem 0 1.25rem;
}

.login-error {
  color: var(--color-danger);
  background: #fbebe8;
  border: 1px solid #efcac5;
  border-radius: var(--radius-card);
  padding: 0.75rem;
  font-size: 0.9rem;
  margin-bottom: 1rem;
}

.field {
  display: grid;
  gap: 0.35rem;
  margin-bottom: 1rem;
}

.field span {
  color: var(--color-ink-soft);
  font-size: 0.85rem;
  font-weight: 700;
}

.field input {
  width: 100%;
  min-height: 2.65rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-card);
  background: var(--color-surface-strong);
  padding: 0.65rem 0.75rem;
}

.submit-btn {
  width: 100%;
  min-height: 2.7rem;
  border: 1px solid var(--color-primary);
  border-radius: var(--radius-card);
  background: var(--color-primary);
  color: #fff;
  font-weight: 800;
  cursor: pointer;
}

.submit-btn:disabled {
  cursor: not-allowed;
  opacity: 0.62;
}

.demo-hint {
  margin-top: 1rem;
  color: var(--color-muted);
  font-size: 0.8rem;
}

.demo-hint pre {
  overflow-x: auto;
  white-space: pre-wrap;
}
```

- [ ] **Step 3: Run login verification**

Run:

```bash
docker compose run --rm tooling bun --filter @nailly/web lint
```

Expected: exit 0.

- [ ] **Step 4: Commit login redesign**

Run:

```bash
git add apps/web/pages/admin/login.vue
git commit -m "style: redesign admin login"
```

---

### Task 10: Final Verification and Responsive Review

**Files:**
- Review all modified frontend files.

- [ ] **Step 1: Run full frontend test suite**

Run:

```bash
docker compose run --rm tooling bun --filter @nailly/web test
```

Expected: all frontend tests pass.

- [ ] **Step 2: Run frontend typecheck/lint**

Run:

```bash
docker compose run --rm tooling bun --filter @nailly/web lint
```

Expected: exit 0.

- [ ] **Step 3: Run frontend production build**

Run:

```bash
docker compose run --rm tooling bun --filter @nailly/web build
```

Expected: exit 0.

- [ ] **Step 4: Start the app for manual responsive review**

Run:

```bash
docker compose up -d postgres redis minio minio-init
docker compose run --rm tooling bun --filter @nailly/api db:push
docker compose run --rm tooling bun --filter @nailly/api db:seed
docker compose up api web
```

Expected:

- Web is available at `http://localhost:3000`.
- API health is available at `http://localhost:8787/health`.

- [ ] **Step 5: Review responsive acceptance checklist**

In browser devtools, verify these widths: `390px`, `768px`, `1024px`, and desktop width.

Check:

- Public nav does not overflow.
- Landing hero shows brand/title/CTA and next section is reachable without awkward blank space.
- Services, proof cards, gallery, staff, and visit panels stack cleanly on mobile.
- Booking form is single-column on mobile.
- Time slots stay large enough to tap and do not resize unpredictably.
- Booking summary appears below the form flow on mobile.
- Admin sidebar becomes responsive nav on mobile.
- Admin booking table becomes cards on mobile.
- Services, staff, media, settings, and login pages have no clipped or overlapping text.

- [ ] **Step 6: Inspect git diff**

Run:

```bash
git status --short
git diff --stat
```

Expected:

- Only intended frontend files and tests are modified.
- `.DS_Store` remains unrelated and untracked if present.

- [ ] **Step 7: Commit final verification fixes or record that none were required**

Run:

```bash
git status --short
```

If `apps/web` files are listed, inspect them with `git diff`, make sure they are final responsive or verification fixes, then run:

```bash
git add apps/web
git commit -m "fix: polish responsive redesign"
```

If no `apps/web` files are listed, do not create an empty commit.
