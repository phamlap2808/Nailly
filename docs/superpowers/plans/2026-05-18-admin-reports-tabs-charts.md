# Admin Reports Tabs And Charts Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the admin Reports page into Nuxt UI tabs backed by `?tab=` URL state and add lightweight CSS/SVG chart sections for each finance report area.

**Architecture:** Keep the backend unchanged and continue loading `GET /admin/reports/revenue` in `apps/web/pages/admin/reports.vue`. Move reusable report chart derivation into `apps/web/utils/report-charts.ts` so tab UI stays focused on rendering and filters. Use Nuxt UI `UTabs` with explicit tab values and a computed route-query model.

**Tech Stack:** Nuxt 4, Vue 3 `<script setup>`, Nuxt UI `UTabs`, TypeScript, Vitest, local CSS/SVG charts.

---

## File Structure Map

- Create `apps/web/utils/report-charts.ts`: pure helper functions for trend rows, top rows, and chart percentages.
- Create `apps/web/tests/report-charts.test.ts`: focused tests for revenue trend grouping and top-row slicing.
- Create `apps/web/tests/admin-reports-tabs.test.ts`: static regression tests for `UTabs`, tab values, URL query model, and tab panel labels.
- Modify `apps/web/pages/admin/reports.vue`: reorganize the page into filters, `UTabs`, tab panels, and charts while preserving API fetches and export URLs.

## Task 1: Report Chart Helpers

**Files:**
- Create: `apps/web/utils/report-charts.ts`
- Create: `apps/web/tests/report-charts.test.ts`

- [ ] **Step 1: Write the failing helper tests**

Create `apps/web/tests/report-charts.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { buildRevenueTrendRows, takeTopRows, toPercent } from '../utils/report-charts'

describe('report chart helpers', () => {
  it('groups visible invoice revenue by issued day in cents', () => {
    expect(
      buildRevenueTrendRows([
        { totalCents: 12000, refundedCents: 2000, issuedAt: '2026-05-18T10:00:00.000Z', createdAt: '2026-05-18T09:00:00.000Z' },
        { totalCents: 8000, refundedCents: 0, issuedAt: '2026-05-18T13:00:00.000Z', createdAt: '2026-05-18T12:00:00.000Z' },
        { totalCents: 5000, refundedCents: 1000, issuedAt: null, createdAt: '2026-05-19T08:00:00.000Z' }
      ])
    ).toEqual([
      { key: '2026-05-18', label: 'May 18', grossCents: 20000, netCents: 18000, invoiceCount: 2 },
      { key: '2026-05-19', label: 'May 19', grossCents: 5000, netCents: 4000, invoiceCount: 1 }
    ])
  })

  it('limits ranked rows without mutating the source rows', () => {
    const rows = [
      { name: 'A', salesCents: 1000 },
      { name: 'B', salesCents: 5000 },
      { name: 'C', salesCents: 3000 }
    ]

    expect(takeTopRows(rows, 'salesCents', 2)).toEqual([
      { name: 'B', salesCents: 5000 },
      { name: 'C', salesCents: 3000 }
    ])
    expect(rows.map((row) => row.name)).toEqual(['A', 'B', 'C'])
  })

  it('converts values to stable chart percentages', () => {
    expect(toPercent(25, 100)).toBe('25%')
    expect(toPercent(0, 100)).toBe('0%')
    expect(toPercent(5, 100, 8)).toBe('8%')
    expect(toPercent(10, 0)).toBe('0%')
  })
})
```

- [ ] **Step 2: Run the tests to verify they fail**

Run:

```bash
bun --filter @nailly/web test -- tests/report-charts.test.ts
```

Expected: FAIL because `apps/web/utils/report-charts.ts` does not exist.

- [ ] **Step 3: Implement the helper module**

Create `apps/web/utils/report-charts.ts`:

```ts
export interface RevenueTrendInvoice {
  totalCents: number
  refundedCents: number
  issuedAt: string | null
  createdAt: string
}

export interface RevenueTrendRow {
  key: string
  label: string
  grossCents: number
  netCents: number
  invoiceCount: number
}

export function buildRevenueTrendRows(invoices: RevenueTrendInvoice[]): RevenueTrendRow[] {
  const rows = new Map<string, RevenueTrendRow>()

  for (const invoice of invoices) {
    const rawDate = invoice.issuedAt ?? invoice.createdAt
    const date = new Date(rawDate)
    const key = date.toISOString().slice(0, 10)
    const current = rows.get(key) ?? {
      key,
      label: new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(date),
      grossCents: 0,
      netCents: 0,
      invoiceCount: 0
    }

    current.grossCents += invoice.totalCents
    current.netCents += invoice.totalCents - invoice.refundedCents
    current.invoiceCount += 1
    rows.set(key, current)
  }

  return Array.from(rows.values()).sort((a, b) => a.key.localeCompare(b.key))
}

export function takeTopRows<T extends Record<K, number>, K extends keyof T>(rows: T[], amountKey: K, limit: number) {
  return [...rows].sort((a, b) => b[amountKey] - a[amountKey]).slice(0, limit)
}

export function toPercent(value: number, max: number, minVisible = 0) {
  if (max <= 0 || value <= 0) return '0%'
  return `${Math.max(minVisible, Math.round((value / max) * 100))}%`
}
```

- [ ] **Step 4: Run the helper tests to verify they pass**

Run:

```bash
bun --filter @nailly/web test -- tests/report-charts.test.ts
```

Expected: PASS.

## Task 2: Reports Tab Contract

**Files:**
- Create: `apps/web/tests/admin-reports-tabs.test.ts`
- Modify: `apps/web/pages/admin/reports.vue`

- [ ] **Step 1: Write the failing static page test**

Create `apps/web/tests/admin-reports-tabs.test.ts`:

```ts
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const reportsPage = readFileSync(new URL('../pages/admin/reports.vue', import.meta.url), 'utf8')

describe('admin reports tabs', () => {
  it('uses Nuxt UI tabs with URL-backed active report state', () => {
    expect(reportsPage).toContain('<UTabs')
    expect(reportsPage).toContain('v-model="activeReportTab"')
    expect(reportsPage).toContain('route.query.tab')
    expect(reportsPage).toContain('router.push')
  })

  it('defines the approved report tab values', () => {
    for (const value of ['overview', 'revenue', 'payments', 'services', 'staff', 'exports']) {
      expect(reportsPage).toContain(`value: '${value}'`)
    }
  })

  it('renders the expected report tab panels and chart labels', () => {
    for (const label of [
      'Revenue trend',
      'Payment mix',
      'Revenue by status',
      'Payments by method',
      'Service sales',
      'Staff payroll',
      'CSV downloads'
    ]) {
      expect(reportsPage).toContain(label)
    }
  })
})
```

- [ ] **Step 2: Run the tab test to verify it fails**

Run:

```bash
bun --filter @nailly/web test -- tests/admin-reports-tabs.test.ts
```

Expected: FAIL because the current page does not use `UTabs` or URL-backed tab state.

- [ ] **Step 3: Add tab model and derived chart data**

In `apps/web/pages/admin/reports.vue`, update the `<script setup>` imports:

```ts
import type { TabsItem } from '@nuxt/ui'
import { getInvoiceStatusLabel, getPaymentMethodLabel } from '../../utils/finance-format'
import { formatPrice } from '../../utils/format'
import { summarizeRevenue } from '../../utils/finance-reports'
import { buildRevenueTrendRows, takeTopRows, toPercent } from '../../utils/report-charts'
import { resolveRuntimeApiBaseUrl } from '../../utils/api-url'
```

After `requestHeaders`, add route-backed tab state:

```ts
const route = useRoute()
const router = useRouter()
const reportTabs = [
  { label: 'Overview', value: 'overview' },
  { label: 'Revenue', value: 'revenue' },
  { label: 'Payments', value: 'payments' },
  { label: 'Services', value: 'services' },
  { label: 'Staff', value: 'staff' },
  { label: 'Exports', value: 'exports' }
] satisfies TabsItem[]
const reportTabValues = new Set(reportTabs.map((tab) => String(tab.value)))
const activeReportTab = computed({
  get() {
    const tab = Array.isArray(route.query.tab) ? route.query.tab[0] : route.query.tab
    return tab && reportTabValues.has(tab) ? tab : 'overview'
  },
  set(tab) {
    router.push({
      path: route.path,
      query: { ...route.query, tab: tab === 'overview' ? undefined : tab }
    })
  }
})
```

Add all report collections:

```ts
const allRefunds = computed(() => report.value?.refunds ?? [])
```

Add visible refunds and chart rows after `visiblePayments`:

```ts
const visibleRefunds = computed(() =>
  allRefunds.value.filter((refund) => visibleInvoiceIds.value.has(refund.invoiceId))
)
const revenueTrendRows = computed(() => buildRevenueTrendRows(visibleInvoices.value))
const topServiceRows = computed(() => takeTopRows(serviceRows.value, 'salesCents', 5))
const topPayrollRows = computed(() => takeTopRows(payrollRows.value, 'salesCents', 5))
```

Add max values:

```ts
const maxTrendCents = computed(() => Math.max(0, ...revenueTrendRows.value.map((row) => row.netCents)))
const maxServiceCents = computed(() => Math.max(0, ...serviceRows.value.map((row) => row.salesCents)))
const maxPayrollCents = computed(() => Math.max(0, ...payrollRows.value.map((row) => row.salesCents)))
```

Replace `barWidth` with:

```ts
function barWidth(value: number, max: number) {
  return toPercent(value, max, 4)
}
```

- [ ] **Step 4: Replace the report body with `UTabs` panels**

In `apps/web/pages/admin/reports.vue`, keep the existing header, filters, loading state, and fetch. Replace the current `template v-else` body with:

```vue
<template v-else>
  <UTabs
    v-model="activeReportTab"
    :content="false"
    :items="reportTabs"
    color="neutral"
    variant="pill"
    class="report-tabs"
  />

  <section v-show="activeReportTab === 'overview'" class="report-tab-panel">
    <section class="kpi-grid" aria-label="Revenue summary">
      <article class="kpi-card"><span>Gross</span><strong>{{ formatPrice(summary.grossCents) }}</strong></article>
      <article class="kpi-card"><span>Refunds</span><strong>{{ formatPrice(summary.refundedCents) }}</strong></article>
      <article class="kpi-card"><span>Net</span><strong>{{ formatPrice(summary.netCents) }}</strong></article>
      <article class="kpi-card"><span>Tax</span><strong>{{ formatPrice(summary.taxCents) }}</strong></article>
      <article class="kpi-card"><span>Tips</span><strong>{{ formatPrice(summary.tipCents) }}</strong></article>
      <article class="kpi-card"><span>Invoices</span><strong>{{ summary.invoiceCount }}</strong></article>
    </section>

    <div class="report-grid">
      <section class="surface-panel report-panel">
        <div class="section-heading"><h2>Revenue trend</h2><span>{{ revenueTrendRows.length }} days</span></div>
        <div v-if="!revenueTrendRows.length" class="empty-chart">No revenue in this range.</div>
        <div v-else class="trend-chart" aria-label="Revenue trend">
          <div v-for="row in revenueTrendRows" :key="row.key" class="trend-bar">
            <span class="trend-value">{{ formatPrice(row.netCents) }}</span>
            <div class="trend-track"><span :style="{ height: barWidth(row.netCents, maxTrendCents) }" /></div>
            <span class="trend-label">{{ row.label }}</span>
          </div>
        </div>
      </section>

      <section class="surface-panel report-panel">
        <div class="section-heading"><h2>Payment mix</h2><span>{{ visiblePayments.length }} payments</span></div>
        <div v-if="!paymentBreakdown.length" class="empty-chart">No payments in this range.</div>
        <div v-else class="mix-layout">
          <div class="donut-chart" aria-hidden="true"></div>
          <div class="legend-list">
            <div v-for="row in paymentBreakdown" :key="row.method" class="legend-row">
              <span>{{ getPaymentMethodLabel(row.method) }}</span>
              <strong>{{ formatPrice(row.amountCents) }}</strong>
            </div>
          </div>
        </div>
      </section>
    </div>

    <div class="report-grid">
      <section class="surface-panel report-panel">
        <div class="section-heading"><h2>Top services</h2><span>{{ serviceRows.length }} services</span></div>
        <div class="bar-list compact-list">
          <div v-for="row in topServiceRows" :key="row.key" class="bar-row">
            <div><strong>{{ row.name }}</strong><span>{{ row.quantity }} sold</span></div>
            <div class="bar-track" aria-hidden="true"><span :style="{ width: barWidth(row.salesCents, maxServiceCents) }" /></div>
            <strong>{{ formatPrice(row.salesCents) }}</strong>
          </div>
        </div>
      </section>

      <section class="surface-panel report-panel">
        <div class="section-heading"><h2>Top staff</h2><span>{{ payrollRows.length }} artists</span></div>
        <div class="bar-list compact-list">
          <div v-for="row in topPayrollRows" :key="row.key" class="bar-row">
            <div><strong>{{ row.staffName }}</strong><span>{{ row.lineCount }} lines</span></div>
            <div class="bar-track" aria-hidden="true"><span :style="{ width: barWidth(row.salesCents, maxPayrollCents) }" /></div>
            <strong>{{ formatPrice(row.salesCents) }}</strong>
          </div>
        </div>
      </section>
    </div>
  </section>

  <section v-show="activeReportTab === 'revenue'" class="surface-panel report-panel report-tab-panel">
    <div class="section-heading"><h2>Revenue by status</h2><span>{{ visibleInvoices.length }} invoices</span></div>
    <div v-if="!statusBreakdown.length" class="empty-chart">No invoices match the selected filters.</div>
    <div v-else class="bar-list">
      <div v-for="row in statusBreakdown" :key="row.status" class="bar-row">
        <div><strong>{{ getInvoiceStatusLabel(row.status) }}</strong><span>{{ row.count }} invoices</span></div>
        <div class="bar-track" aria-hidden="true"><span :style="{ width: barWidth(row.totalCents, maxStatusCents) }" /></div>
        <strong>{{ formatPrice(row.totalCents) }}</strong>
      </div>
    </div>
  </section>

  <section v-show="activeReportTab === 'payments'" class="report-tab-panel">
    <div class="report-grid">
      <section class="surface-panel report-panel">
        <div class="section-heading"><h2>Payments by method</h2><span>{{ visiblePayments.length }} payments</span></div>
        <div v-if="!paymentBreakdown.length" class="empty-chart">No payments match the selected filters.</div>
        <div v-else class="bar-list">
          <div v-for="row in paymentBreakdown" :key="row.method" class="bar-row">
            <div><strong>{{ getPaymentMethodLabel(row.method) }}</strong><span>{{ row.count }} payments</span></div>
            <div class="bar-track" aria-hidden="true"><span :style="{ width: barWidth(row.amountCents, maxPaymentCents) }" /></div>
            <strong>{{ formatPrice(row.amountCents) }}</strong>
          </div>
        </div>
      </section>
      <section class="surface-panel report-panel">
        <div class="section-heading"><h2>Refunds</h2><span>{{ visibleRefunds.length }} refunds</span></div>
        <div v-if="!visibleRefunds.length" class="empty-chart">No refunds match the selected filters.</div>
        <div v-else class="bar-list">
          <div v-for="refund in visibleRefunds" :key="refund.id" class="history-row">
            <span>{{ getPaymentMethodLabel(refund.method) }}</span>
            <strong>{{ formatPrice(refund.amountCents) }}</strong>
          </div>
        </div>
      </section>
    </div>
  </section>

  <section v-show="activeReportTab === 'services'" class="surface-panel table-panel report-tab-panel">
    <div class="section-heading"><h2>Service sales</h2><span>{{ serviceRows.length }} services</span></div>
    <div class="report-table service-table" role="table" aria-label="Service sales">
      <div class="report-table-head" role="row"><span>Service</span><span>Lines</span><span>Qty</span><span>Sales</span></div>
      <div v-for="row in serviceRows" :key="row.key" class="report-row" role="row">
        <strong>{{ row.name }}</strong><span>{{ row.lineCount }}</span><span>{{ row.quantity }}</span><strong>{{ formatPrice(row.salesCents) }}</strong>
      </div>
    </div>
  </section>

  <section v-show="activeReportTab === 'staff'" class="surface-panel table-panel report-tab-panel">
    <div class="section-heading"><h2>Staff payroll</h2><span>{{ payrollRows.length }} artists</span></div>
    <div class="report-table payroll-table" role="table" aria-label="Staff payroll">
      <div class="report-table-head" role="row"><span>Staff</span><span>Lines</span><span>Sales</span><span>Commission</span></div>
      <div v-for="row in payrollRows" :key="row.key" class="report-row" role="row">
        <strong>{{ row.staffName }}</strong><span>{{ row.lineCount }}</span><span>{{ formatPrice(row.salesCents) }}</span><strong>{{ formatPrice(row.commissionCents) }}</strong>
      </div>
    </div>
  </section>

  <section v-show="activeReportTab === 'exports'" class="surface-panel export-panel report-tab-panel">
    <div>
      <p class="section-label">Exports</p>
      <h2>CSV downloads</h2>
      <p class="muted-copy">Downloads use the existing report export endpoints.</p>
    </div>
    <div class="export-actions">
      <a class="btn-secondary" :href="exportUrl('invoices.csv')" download>Invoices</a>
      <a class="btn-secondary" :href="exportUrl('payments.csv')" download>Payments</a>
      <a class="btn-secondary" :href="exportUrl('refunds.csv')" download>Refunds</a>
      <a class="btn-secondary" :href="exportUrl('payroll.csv')" download>Payroll</a>
    </div>
  </section>
</template>
```

- [ ] **Step 5: Add tab and chart styles**

In `apps/web/pages/admin/reports.vue`, add these scoped styles before the existing media queries:

```css
.report-tabs {
  margin-bottom: 1rem;
  overflow-x: auto;
}

.report-tab-panel {
  margin-bottom: 1rem;
}

.trend-chart {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(72px, 1fr));
  gap: 0.75rem;
  min-height: 13rem;
}

.trend-bar {
  display: grid;
  grid-template-rows: auto minmax(8rem, 1fr) auto;
  gap: 0.45rem;
  min-width: 0;
}

.trend-value,
.trend-label {
  color: var(--color-muted);
  font-size: 0.78rem;
  font-weight: 800;
  text-align: center;
}

.trend-track {
  align-items: end;
  background: rgba(116, 85, 70, 0.1);
  border-radius: 999px 999px 6px 6px;
  display: flex;
  overflow: hidden;
}

.trend-track span {
  background: linear-gradient(180deg, var(--color-primary), var(--color-accent));
  border-radius: inherit;
  display: block;
  width: 100%;
}

.mix-layout {
  display: grid;
  grid-template-columns: minmax(8rem, 0.45fr) 1fr;
  gap: 1rem;
  align-items: center;
}

.donut-chart {
  aspect-ratio: 1;
  border-radius: 50%;
  background: conic-gradient(var(--color-primary) 0 46%, var(--color-accent) 46% 72%, var(--color-success) 72% 88%, var(--color-border) 88%);
  position: relative;
}

.donut-chart::after {
  background: var(--color-surface);
  border-radius: inherit;
  content: "";
  inset: 28%;
  position: absolute;
}

.legend-list {
  display: grid;
  gap: 0.65rem;
}

.legend-row,
.history-row {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  border-top: 1px solid var(--color-border);
  padding-top: 0.65rem;
}

.empty-chart,
.muted-copy {
  color: var(--color-muted);
}

.empty-chart {
  border: 1px dashed var(--color-border);
  border-radius: var(--radius-card);
  padding: 1.25rem;
}
```

Update the existing `@media (max-width: 900px)` block to include `.mix-layout`:

```css
@media (max-width: 900px) {
  .admin-page-header,
  .export-panel,
  .report-grid,
  .report-filters,
  .bar-row,
  .mix-layout,
  .service-table .report-table-head,
  .service-table .report-row,
  .payroll-table .report-table-head,
  .payroll-table .report-row {
    display: grid;
    grid-template-columns: 1fr;
  }
}
```

- [ ] **Step 6: Run the page contract test**

Run:

```bash
bun --filter @nailly/web test -- tests/admin-reports-tabs.test.ts
```

Expected: PASS.

## Task 3: Verification

**Files:**
- Modify: no additional files unless verification exposes a compile or behavior issue.

- [ ] **Step 1: Run focused reports tests**

Run:

```bash
bun --filter @nailly/web test -- tests/report-charts.test.ts tests/admin-reports-tabs.test.ts tests/finance-reports.test.ts
```

Expected: PASS with all focused report tests green.

- [ ] **Step 2: Run all web tests**

Run:

```bash
bun --filter @nailly/web test
```

Expected: PASS.

- [ ] **Step 3: Run Docker typecheck**

Run:

```bash
docker compose run --rm tooling bun --filter @nailly/web lint
```

Expected: exits with code `0`.

- [ ] **Step 4: Run Docker build**

Run:

```bash
docker compose run --rm tooling bun --filter @nailly/web build
```

Expected: exits with code `0`.

- [ ] **Step 5: Manually verify route query behavior**

With the dev server running, open:

```text
http://localhost:3000/admin/reports?tab=payments
```

Expected:

- Payments tab is active.
- Changing tabs updates `?tab=...`.
- Refresh keeps the selected tab.
- Invalid query such as `?tab=missing` renders Overview.

## Self-Review

- Spec coverage: Task 1 covers chart helper data, Task 2 covers `UTabs`, tab values, URL query state, tab panels, exports, and CSS/SVG charts, Task 3 covers verification.
- Placeholder scan: no placeholders, no deferred implementation notes, no unresolved choices.
- Type consistency: tab value names match the approved spec; helper names used in tests match helper implementation and page imports.
