# Full Finance Suite Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the admin Full Finance Suite: checkout, walk-in POS invoices, payments, refunds, printed bills, revenue reports, payroll-style commission reports, and CSV exports.

**Architecture:** Add shared finance schemas/math first, then persist invoice/payment/refund data in PostgreSQL, expose admin finance APIs through the existing Hono admin router, and build Nuxt admin pages around small finance utility helpers. Invoice totals and commission are snapshot-based so later service/staff changes do not rewrite historical finance records.

**Tech Stack:** TypeScript, Zod, Drizzle ORM, Hono, PostgreSQL, Nuxt/Vue, Vitest, Docker Compose.

---

## Scope Notes

This spec spans several subsystems. Implement it in four phases, with commits after each task:

1. Finance foundation.
2. Checkout/POS and invoice management.
3. Print, void, and refunds.
4. Reports, payroll, and exports.

Each phase must leave the app runnable. Do not start a later phase if earlier phase tests are failing.

## File Map

### Shared Package

- Modify `packages/shared/src/schemas.ts`: finance enums, invoice schemas, payment/refund schemas.
- Modify `packages/shared/src/index.ts`: export new schemas.
- Modify `packages/shared/src/schemas.test.ts`: validation coverage.

### API

- Modify `apps/api/src/db/schema.ts`: finance tables and new settings/staff fields.
- Modify `apps/api/src/db/seed-data.ts`: demo finance data inputs.
- Modify `apps/api/src/db/seed-data.test.ts`: seed expectations.
- Modify `apps/api/src/db/seed.ts`: insert finance demo data.
- Create `apps/api/src/services/finance-math.ts`: pure invoice math helper.
- Create `apps/api/src/services/finance-math.test.ts`: math/rounding tests.
- Create `apps/api/src/repositories/finance.repository.ts`: invoice/payment/refund/report persistence.
- Create `apps/api/src/services/finance.service.ts`: business rules and validation orchestration.
- Create `apps/api/src/services/finance.service.test.ts`: service unit tests with repository fakes.
- Create `apps/api/src/routes/finance.test.ts`: route factory and RBAC smoke tests.
- Modify `apps/api/src/routes/admin.ts`: mount finance endpoints.
- Modify `apps/api/src/repositories/admin.repository.ts`: persist `commissionRateBps`, `taxRateBps`, `receiptFooter`, `invoicePrefix`.
- Create `apps/api/src/services/finance-export.ts`: CSV formatting helpers.

### Web

- Modify `apps/web/utils/admin-nav.ts`: add POS, Invoices, Reports nav.
- Create `apps/web/utils/finance-format.ts`: money, percent, invoice status/payment labels.
- Create `apps/web/utils/finance-calculator.ts`: client-side draft totals mirroring shared/API math.
- Create `apps/web/tests/finance-calculator.test.ts`: draft totals tests.
- Create `apps/web/tests/finance-format.test.ts`: labels/format tests.
- Create `apps/web/utils/invoice-table.ts`: invoice filtering/pagination helpers.
- Create `apps/web/tests/invoice-table.test.ts`: table helper tests.
- Create `apps/web/pages/admin/pos.vue`: POS and booking checkout page.
- Create `apps/web/pages/admin/invoices.vue`: invoice list.
- Create `apps/web/pages/admin/invoices/[id].vue`: invoice detail, payment/refund actions.
- Create `apps/web/pages/admin/invoices/[id]/receipt.vue`: 80mm print view.
- Create `apps/web/pages/admin/invoices/[id]/print.vue`: A4 invoice print view.
- Create `apps/web/pages/admin/reports.vue`: finance reports and exports.
- Modify `apps/web/pages/admin/bookings.vue`: add Checkout action.
- Modify `apps/web/pages/admin/staff.vue`: commission rate input/column.
- Modify `apps/web/pages/admin/settings.vue`: tax rate, receipt footer, invoice prefix.
- Modify `apps/web/i18n/locales/en.json`: admin labels.

---

## Commands

Use these verification commands unless a task states a narrower command:

```bash
docker run --rm -v "$PWD":/workspace -w /workspace node:22-bookworm-slim bash -lc 'cd packages/shared && node ../../node_modules/vitest/vitest.mjs run'
docker run --rm -v "$PWD":/workspace -w /workspace node:22-bookworm-slim bash -lc 'cd apps/api && node ../../node_modules/vitest/vitest.mjs run'
docker run --rm -v "$PWD":/workspace -w /workspace node:22-bookworm-slim bash -lc 'cd apps/web && node ../../node_modules/vitest/vitest.mjs run'
docker compose run --rm tooling bun --filter @nailly/api lint
docker compose run --rm tooling bun --filter @nailly/web lint
docker compose run --rm tooling bun --filter @nailly/api build
docker compose run --rm tooling bun --filter @nailly/web build
```

---

### Task 1: Shared Finance Schemas

**Files:**
- Modify: `packages/shared/src/schemas.ts`
- Modify: `packages/shared/src/index.ts`
- Modify: `packages/shared/src/schemas.test.ts`

- [ ] **Step 1: Write failing shared schema tests**

Add these tests to `packages/shared/src/schemas.test.ts`:

```ts
import {
  financePaymentMethodSchema,
  invoiceCreateSchema,
  invoiceRefundSchema,
  invoiceStatusSchema
} from './schemas'

describe('finance schemas', () => {
  it('validates supported invoice statuses and payment methods', () => {
    expect(invoiceStatusSchema.parse('paid')).toBe('paid')
    expect(invoiceStatusSchema.parse('partially_refunded')).toBe('partially_refunded')
    expect(invoiceStatusSchema.safeParse('processing').success).toBe(false)

    expect(financePaymentMethodSchema.parse('credit_card')).toBe('credit_card')
    expect(financePaymentMethodSchema.parse('gift_card')).toBe('gift_card')
    expect(financePaymentMethodSchema.safeParse('crypto').success).toBe(false)
  })

  it('validates walk-in invoice creation with per-line staff assignment', () => {
    const parsed = invoiceCreateSchema.parse({
      source: 'walk_in',
      customerName: 'Olivia Carter',
      customerPhone: '+1 555 0100',
      items: [
        {
          itemType: 'service',
          serviceId: 'svc-1',
          staffId: 'staff-1',
          name: 'Gel Manicure',
          quantity: 1,
          unitPriceCents: 5800
        },
        {
          itemType: 'manual',
          staffId: 'staff-2',
          name: 'Chrome Finish',
          quantity: 1,
          unitPriceCents: 1800
        }
      ],
      discountCents: 500,
      discountReason: 'Loyalty',
      tipCents: 1000
    })

    expect(parsed.source).toBe('walk_in')
    expect(parsed.items).toHaveLength(2)
    expect(parsed.items[0].staffId).toBe('staff-1')
  })

  it('validates refunds with amount, method, and reason', () => {
    expect(
      invoiceRefundSchema.parse({
        amountCents: 2000,
        method: 'cash',
        reason: 'Customer requested partial refund'
      })
    ).toEqual({
      amountCents: 2000,
      method: 'cash',
      reason: 'Customer requested partial refund'
    })
  })
})
```

- [ ] **Step 2: Run shared tests to verify RED**

Run:

```bash
docker run --rm -v "$PWD":/workspace -w /workspace node:22-bookworm-slim bash -lc 'cd packages/shared && node ../../node_modules/vitest/vitest.mjs run src/schemas.test.ts'
```

Expected: FAIL because `financePaymentMethodSchema`, `invoiceCreateSchema`, `invoiceRefundSchema`, and `invoiceStatusSchema` are not exported yet.

- [ ] **Step 3: Add shared finance enums and schemas**

In `packages/shared/src/schemas.ts`, add after booking schemas:

```ts
export const invoiceStatusValues = [
  'draft',
  'open',
  'paid',
  'partially_refunded',
  'refunded',
  'void'
] as const
export const invoiceStatusSchema = z.enum(invoiceStatusValues)
export type InvoiceStatus = z.infer<typeof invoiceStatusSchema>

export const invoiceSourceValues = ['booking', 'walk_in'] as const
export const invoiceSourceSchema = z.enum(invoiceSourceValues)
export type InvoiceSource = z.infer<typeof invoiceSourceSchema>

export const invoiceItemTypeValues = ['service', 'manual'] as const
export const invoiceItemTypeSchema = z.enum(invoiceItemTypeValues)
export type InvoiceItemType = z.infer<typeof invoiceItemTypeSchema>

export const financePaymentMethodValues = [
  'cash',
  'credit_card',
  'debit_card',
  'zelle',
  'venmo',
  'gift_card',
  'other'
] as const
export const financePaymentMethodSchema = z.enum(financePaymentMethodValues)
export type FinancePaymentMethod = z.infer<typeof financePaymentMethodSchema>

const moneyCentsSchema = z.number().int().min(0)
const basisPointsSchema = z.number().int().min(0).max(10000)

export const invoiceItemInputSchema = z.object({
  itemType: invoiceItemTypeSchema,
  serviceId: z.string().min(1).nullable().optional(),
  staffId: z.string().min(1).nullable().optional(),
  name: z.string().trim().min(1).max(160),
  description: z.string().trim().max(500).optional().or(z.literal('')),
  quantity: z.number().int().min(1).max(99),
  unitPriceCents: moneyCentsSchema
})
export type InvoiceItemInput = z.infer<typeof invoiceItemInputSchema>

export const invoiceCreateSchema = z.object({
  source: invoiceSourceSchema,
  bookingId: z.string().min(1).optional().nullable(),
  customerName: z.string().trim().min(1).max(160),
  customerPhone: z.string().trim().max(40).optional().or(z.literal('')),
  customerEmail: z.string().trim().email().optional().or(z.literal('')),
  items: z.array(invoiceItemInputSchema).min(1),
  discountCents: moneyCentsSchema.default(0),
  discountReason: z.string().trim().max(240).optional().or(z.literal('')),
  tipCents: moneyCentsSchema.default(0)
})
export type InvoiceCreateInput = z.input<typeof invoiceCreateSchema>
export type InvoiceCreate = z.output<typeof invoiceCreateSchema>

export const invoicePaymentSchema = z.object({
  method: financePaymentMethodSchema,
  amountCents: moneyCentsSchema.min(1),
  reference: z.string().trim().max(120).optional().or(z.literal('')),
  note: z.string().trim().max(500).optional().or(z.literal('')),
  paidAt: z.string().datetime().optional()
})
export type InvoicePaymentInput = z.input<typeof invoicePaymentSchema>
export type InvoicePayment = z.output<typeof invoicePaymentSchema>

export const invoiceRefundSchema = z.object({
  paymentId: z.string().min(1).optional().nullable(),
  method: financePaymentMethodSchema,
  amountCents: moneyCentsSchema.min(1),
  reason: z.string().trim().min(3).max(500),
  refundedAt: z.string().datetime().optional()
})
export type InvoiceRefundInput = z.input<typeof invoiceRefundSchema>
export type InvoiceRefund = z.output<typeof invoiceRefundSchema>

export const financeSettingsSchema = z.object({
  taxRateBps: basisPointsSchema,
  receiptFooter: z.string().trim().max(500).optional().or(z.literal('')),
  invoicePrefix: z.string().trim().min(1).max(12)
})
export type FinanceSettings = z.infer<typeof financeSettingsSchema>
```

Ensure `packages/shared/src/index.ts` continues to export all schemas:

```ts
export * from './schemas'
```

- [ ] **Step 4: Run shared tests to verify GREEN**

Run:

```bash
docker run --rm -v "$PWD":/workspace -w /workspace node:22-bookworm-slim bash -lc 'cd packages/shared && node ../../node_modules/vitest/vitest.mjs run src/schemas.test.ts'
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/shared/src/schemas.ts packages/shared/src/index.ts packages/shared/src/schemas.test.ts
git commit -m "feat: add shared finance schemas"
```

---

### Task 2: Finance Math Helper

**Files:**
- Create: `apps/api/src/services/finance-math.ts`
- Create: `apps/api/src/services/finance-math.test.ts`

- [ ] **Step 1: Write failing finance math tests**

Create `apps/api/src/services/finance-math.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { calculateInvoiceTotals } from './finance-math'

describe('calculateInvoiceTotals', () => {
  it('calculates subtotal, discount, fixed tax, tip, and total with integer cents', () => {
    expect(
      calculateInvoiceTotals({
        items: [
          { quantity: 1, unitPriceCents: 5800, commissionRateBps: 4500 },
          { quantity: 2, unitPriceCents: 1800, commissionRateBps: 4000 }
        ],
        discountCents: 500,
        taxRateBps: 825,
        tipCents: 1000,
        paidCents: 0,
        refundedCents: 0
      })
    ).toEqual({
      subtotalCents: 9400,
      discountCents: 500,
      taxableSubtotalCents: 8900,
      taxCents: 734,
      tipCents: 1000,
      totalCents: 10634,
      paidCents: 0,
      refundedCents: 0,
      netCollectedCents: 0,
      itemCommissions: [2610, 1440]
    })
  })

  it('caps discounts at subtotal and subtracts refunds from net collected', () => {
    expect(
      calculateInvoiceTotals({
        items: [{ quantity: 1, unitPriceCents: 5000, commissionRateBps: 5000 }],
        discountCents: 8000,
        taxRateBps: 825,
        tipCents: 0,
        paidCents: 5000,
        refundedCents: 2000
      })
    ).toMatchObject({
      subtotalCents: 5000,
      discountCents: 5000,
      taxCents: 0,
      totalCents: 0,
      paidCents: 5000,
      refundedCents: 2000,
      netCollectedCents: 3000
    })
  })
})
```

- [ ] **Step 2: Run finance math test to verify RED**

Run:

```bash
docker run --rm -v "$PWD":/workspace -w /workspace node:22-bookworm-slim bash -lc 'cd apps/api && node ../../node_modules/vitest/vitest.mjs run src/services/finance-math.test.ts'
```

Expected: FAIL because `finance-math.ts` does not exist.

- [ ] **Step 3: Implement finance math helper**

Create `apps/api/src/services/finance-math.ts`:

```ts
export interface FinanceMathItem {
  quantity: number
  unitPriceCents: number
  commissionRateBps: number
}

export interface FinanceMathInput {
  items: FinanceMathItem[]
  discountCents: number
  taxRateBps: number
  tipCents: number
  paidCents: number
  refundedCents: number
}

export interface FinanceMathResult {
  subtotalCents: number
  discountCents: number
  taxableSubtotalCents: number
  taxCents: number
  tipCents: number
  totalCents: number
  paidCents: number
  refundedCents: number
  netCollectedCents: number
  itemCommissions: number[]
}

function cents(value: number) {
  return Math.max(0, Math.trunc(value))
}

export function calculateInvoiceTotals(input: FinanceMathInput): FinanceMathResult {
  const subtotalCents = input.items.reduce(
    (sum, item) => sum + cents(item.quantity) * cents(item.unitPriceCents),
    0
  )
  const discountCents = Math.min(cents(input.discountCents), subtotalCents)
  const taxableSubtotalCents = subtotalCents - discountCents
  const taxCents = Math.round((taxableSubtotalCents * cents(input.taxRateBps)) / 10000)
  const tipCents = cents(input.tipCents)
  const totalCents = taxableSubtotalCents + taxCents + tipCents
  const paidCents = cents(input.paidCents)
  const refundedCents = cents(input.refundedCents)

  return {
    subtotalCents,
    discountCents,
    taxableSubtotalCents,
    taxCents,
    tipCents,
    totalCents,
    paidCents,
    refundedCents,
    netCollectedCents: paidCents - refundedCents,
    itemCommissions: input.items.map((item) =>
      Math.round((cents(item.quantity) * cents(item.unitPriceCents) * cents(item.commissionRateBps)) / 10000)
    )
  }
}
```

- [ ] **Step 4: Run finance math test to verify GREEN**

Run:

```bash
docker run --rm -v "$PWD":/workspace -w /workspace node:22-bookworm-slim bash -lc 'cd apps/api && node ../../node_modules/vitest/vitest.mjs run src/services/finance-math.test.ts'
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/services/finance-math.ts apps/api/src/services/finance-math.test.ts
git commit -m "feat: add invoice finance math"
```

---

### Task 3: Database Schema for Finance

**Files:**
- Modify: `apps/api/src/db/schema.ts`
- Modify: `apps/api/src/db/seed-data.test.ts`

- [ ] **Step 1: Write failing schema/seed tests**

Add this import and test to `apps/api/src/db/seed-data.test.ts`:

```ts
import { invoices, invoiceItems, payments, refunds, staff, shopSettings } from './schema'

it('defines finance persistence columns for invoices, payments, refunds, settings, and staff commission', () => {
  expect(invoices).toBeDefined()
  expect(invoiceItems).toBeDefined()
  expect(payments).toBeDefined()
  expect(refunds).toBeDefined()
  expect(shopSettings.taxRateBps).toBeDefined()
  expect(shopSettings.invoicePrefix).toBeDefined()
  expect(shopSettings.receiptFooter).toBeDefined()
  expect(staff.commissionRateBps).toBeDefined()
})
```

- [ ] **Step 2: Run test to verify RED**

Run:

```bash
docker run --rm -v "$PWD":/workspace -w /workspace node:22-bookworm-slim bash -lc 'cd apps/api && node ../../node_modules/vitest/vitest.mjs run src/db/seed-data.test.ts'
```

Expected: FAIL because finance schema exports and columns do not exist.

- [ ] **Step 3: Add finance schema**

Modify `apps/api/src/db/schema.ts`.

Use integer cents and integer basis points. Do not add decimal money columns.

```ts
export const invoiceStatus = pgEnum('invoice_status', [
  'draft',
  'open',
  'paid',
  'partially_refunded',
  'refunded',
  'void'
])

export const invoiceSource = pgEnum('invoice_source', ['booking', 'walk_in'])
export const invoiceItemType = pgEnum('invoice_item_type', ['service', 'manual'])
export const financePaymentMethod = pgEnum('finance_payment_method', [
  'cash',
  'credit_card',
  'debit_card',
  'zelle',
  'venmo',
  'gift_card',
  'other'
])
```

Extend `shopSettings`:

```ts
taxRateBps: integer('tax_rate_bps').notNull().default(825),
receiptFooter: text('receipt_footer').notNull().default('Thank you for visiting Luma Nail Studio.'),
invoicePrefix: text('invoice_prefix').notNull().default('INV'),
```

Extend `staff`:

```ts
commissionRateBps: integer('commission_rate_bps').notNull().default(4000),
```

Add tables after `bookingServices`:

```ts
export const invoices = pgTable('invoices', {
  id: uuid('id').primaryKey().defaultRandom(),
  invoiceNumber: text('invoice_number').notNull().unique(),
  source: invoiceSource('source').notNull(),
  bookingId: uuid('booking_id').references(() => bookings.id),
  customerName: text('customer_name').notNull(),
  customerPhone: text('customer_phone'),
  customerEmail: text('customer_email'),
  status: invoiceStatus('status').notNull().default('draft'),
  subtotalCents: integer('subtotal_cents').notNull().default(0),
  discountCents: integer('discount_cents').notNull().default(0),
  discountReason: text('discount_reason'),
  taxRateBps: integer('tax_rate_bps').notNull().default(0),
  taxCents: integer('tax_cents').notNull().default(0),
  tipCents: integer('tip_cents').notNull().default(0),
  totalCents: integer('total_cents').notNull().default(0),
  paidCents: integer('paid_cents').notNull().default(0),
  refundedCents: integer('refunded_cents').notNull().default(0),
  voidReason: text('void_reason'),
  issuedAt: timestamp('issued_at', { withTimezone: true }),
  paidAt: timestamp('paid_at', { withTimezone: true }),
  voidedAt: timestamp('voided_at', { withTimezone: true }),
  createdBy: uuid('created_by').references(() => adminUsers.id),
  updatedBy: uuid('updated_by').references(() => adminUsers.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
})

export const invoiceItems = pgTable('invoice_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  invoiceId: uuid('invoice_id').references(() => invoices.id).notNull(),
  itemType: invoiceItemType('item_type').notNull(),
  serviceId: uuid('service_id').references(() => services.id),
  staffId: uuid('staff_id').references(() => staff.id),
  name: text('name').notNull(),
  description: text('description'),
  quantity: integer('quantity').notNull().default(1),
  unitPriceCents: integer('unit_price_cents').notNull(),
  lineTotalCents: integer('line_total_cents').notNull(),
  commissionRateBps: integer('commission_rate_bps').notNull().default(0),
  commissionCents: integer('commission_cents').notNull().default(0),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
})

export const payments = pgTable('payments', {
  id: uuid('id').primaryKey().defaultRandom(),
  invoiceId: uuid('invoice_id').references(() => invoices.id).notNull(),
  method: financePaymentMethod('method').notNull(),
  amountCents: integer('amount_cents').notNull(),
  reference: text('reference'),
  note: text('note'),
  paidAt: timestamp('paid_at', { withTimezone: true }).defaultNow().notNull(),
  createdBy: uuid('created_by').references(() => adminUsers.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
})

export const refunds = pgTable('refunds', {
  id: uuid('id').primaryKey().defaultRandom(),
  invoiceId: uuid('invoice_id').references(() => invoices.id).notNull(),
  paymentId: uuid('payment_id').references(() => payments.id),
  method: financePaymentMethod('method').notNull(),
  amountCents: integer('amount_cents').notNull(),
  reason: text('reason').notNull(),
  refundedAt: timestamp('refunded_at', { withTimezone: true }).defaultNow().notNull(),
  createdBy: uuid('created_by').references(() => adminUsers.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
})
```

- [ ] **Step 4: Run schema test to verify GREEN**

Run:

```bash
docker run --rm -v "$PWD":/workspace -w /workspace node:22-bookworm-slim bash -lc 'cd apps/api && node ../../node_modules/vitest/vitest.mjs run src/db/seed-data.test.ts'
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/db/schema.ts apps/api/src/db/seed-data.test.ts
git commit -m "feat: add finance database schema"
```

---

### Task 4: Seed Finance Demo Data

**Files:**
- Modify: `apps/api/src/db/seed-data.ts`
- Modify: `apps/api/src/db/seed.ts`
- Modify: `apps/api/src/db/seed-data.test.ts`

- [ ] **Step 1: Write failing seed data tests**

Add to `apps/api/src/db/seed-data.test.ts`:

```ts
it('includes realistic finance demo data for POS and reporting', () => {
  expect(demoSeed.shop.taxRateBps).toBe(825)
  expect(demoSeed.shop.invoicePrefix).toBe('INV')
  expect(demoSeed.staff.every((person) => typeof person.commissionRateBps === 'number')).toBe(true)
  expect(demoSeed.financeInvoices.length).toBeGreaterThanOrEqual(4)
  expect(demoSeed.financeInvoices.some((invoice) => invoice.source === 'walk_in')).toBe(true)
  expect(demoSeed.financeInvoices.some((invoice) => invoice.refunds.length > 0)).toBe(true)
})
```

- [ ] **Step 2: Run seed data test to verify RED**

Run:

```bash
docker run --rm -v "$PWD":/workspace -w /workspace node:22-bookworm-slim bash -lc 'cd apps/api && node ../../node_modules/vitest/vitest.mjs run src/db/seed-data.test.ts'
```

Expected: FAIL because `taxRateBps`, `invoicePrefix`, `commissionRateBps`, and `financeInvoices` are not seeded.

- [ ] **Step 3: Add demo finance seed structures**

Modify `apps/api/src/db/seed-data.ts`:

```ts
shop: {
  ...
  taxRateBps: 825,
  receiptFooter: 'Thank you for visiting Luma Nail Studio.',
  invoicePrefix: 'INV'
},
```

Add `commissionRateBps` to each staff object:

```ts
{ name: 'Maya Chen', title: 'Senior Nail Artist', bio: '...', sortOrder: 1, commissionRateBps: 4500 }
```

Add a `financeInvoices` array:

```ts
financeInvoices: [
  {
    invoiceNumber: 'INV-DEMO-1001',
    source: 'booking',
    bookingCustomerName: 'Olivia Carter',
    customerName: 'Olivia Carter',
    customerPhone: '+1 555 0101',
    customerEmail: 'olivia@example.com',
    status: 'paid',
    discountCents: 500,
    discountReason: 'Loyalty',
    tipCents: 1000,
    items: [
      { itemType: 'service', serviceName: 'Gel Manicure', staffName: 'Maya Chen', quantity: 1, unitPriceCents: 5800 },
      { itemType: 'service', serviceName: 'Chrome Finish', staffName: 'Harper Lee', quantity: 1, unitPriceCents: 1800 }
    ],
    payments: [{ method: 'credit_card', amountCents: 8134, reference: 'demo-card-1001' }],
    refunds: []
  },
  {
    invoiceNumber: 'INV-DEMO-1002',
    source: 'walk_in',
    customerName: 'Avery Stone',
    customerPhone: '+1 555 0102',
    customerEmail: '',
    status: 'paid',
    discountCents: 0,
    tipCents: 800,
    items: [
      { itemType: 'service', serviceName: 'Classic Pedicure', staffName: 'Nina Patel', quantity: 1, unitPriceCents: 5200 }
    ],
    payments: [{ method: 'cash', amountCents: 6429 }],
    refunds: []
  },
  {
    invoiceNumber: 'INV-DEMO-1003',
    source: 'walk_in',
    customerName: 'Mia Thompson',
    customerPhone: '+1 555 0103',
    customerEmail: 'mia@example.com',
    status: 'partially_refunded',
    discountCents: 0,
    tipCents: 1200,
    items: [
      { itemType: 'service', serviceName: 'Soft Gel Extensions', staffName: 'Sofia Reyes', quantity: 1, unitPriceCents: 9800 }
    ],
    payments: [{ method: 'venmo', amountCents: 11809 }],
    refunds: [{ method: 'venmo', amountCents: 2000, reason: 'Partial courtesy refund' }]
  },
  {
    invoiceNumber: 'INV-DEMO-1004',
    source: 'booking',
    bookingCustomerName: 'Grace Nguyen',
    customerName: 'Grace Nguyen',
    customerPhone: '+1 555 0104',
    customerEmail: 'grace@example.com',
    status: 'paid',
    discountCents: 0,
    tipCents: 0,
    items: [
      { itemType: 'service', serviceName: 'Spa Pedicure', staffName: 'Nina Patel', quantity: 1, unitPriceCents: 7000 }
    ],
    payments: [{ method: 'zelle', amountCents: 7578 }],
    refunds: []
  }
]
```

- [ ] **Step 4: Insert finance seed rows**

Modify `apps/api/src/db/seed.ts`:

1. Delete finance rows before existing entities:

```ts
await db.delete(schema.refunds)
await db.delete(schema.payments)
await db.delete(schema.invoiceItems)
await db.delete(schema.invoices)
```

2. Insert `taxRateBps`, `receiptFooter`, `invoicePrefix` when inserting shop settings.

3. Insert `commissionRateBps` when inserting staff.

4. After bookings and staff/service maps exist, insert finance invoices in a transaction:

```ts
for (const invoiceDemo of demoSeed.financeInvoices) {
  await db.transaction(async (tx) => {
    const bookingId = invoiceDemo.bookingCustomerName
      ? bookingIdsByCustomerName.get(invoiceDemo.bookingCustomerName) ?? null
      : null

    const itemInputs = invoiceDemo.items.map((item, index) => {
      const serviceId = item.serviceName ? serviceIds.get(item.serviceName) ?? null : null
      const staffId = item.staffName ? staffIds.get(item.staffName) ?? null : null
      const commissionRateBps = item.staffName ? staffCommissionRates.get(item.staffName) ?? 0 : 0
      const lineTotalCents = item.quantity * item.unitPriceCents
      return {
        item,
        serviceId,
        staffId,
        commissionRateBps,
        lineTotalCents,
        sortOrder: index + 1
      }
    })

    const totals = calculateInvoiceTotals({
      items: itemInputs.map((input) => ({
        quantity: input.item.quantity,
        unitPriceCents: input.item.unitPriceCents,
        commissionRateBps: input.commissionRateBps
      })),
      discountCents: invoiceDemo.discountCents,
      taxRateBps: demoSeed.shop.taxRateBps,
      tipCents: invoiceDemo.tipCents,
      paidCents: invoiceDemo.payments.reduce((sum, payment) => sum + payment.amountCents, 0),
      refundedCents: invoiceDemo.refunds.reduce((sum, refund) => sum + refund.amountCents, 0)
    })

    const [invoice] = await tx.insert(schema.invoices).values({
      invoiceNumber: invoiceDemo.invoiceNumber,
      source: invoiceDemo.source,
      bookingId,
      customerName: invoiceDemo.customerName,
      customerPhone: invoiceDemo.customerPhone || null,
      customerEmail: invoiceDemo.customerEmail || null,
      status: invoiceDemo.status,
      subtotalCents: totals.subtotalCents,
      discountCents: totals.discountCents,
      discountReason: invoiceDemo.discountReason ?? null,
      taxRateBps: demoSeed.shop.taxRateBps,
      taxCents: totals.taxCents,
      tipCents: totals.tipCents,
      totalCents: totals.totalCents,
      paidCents: totals.paidCents,
      refundedCents: totals.refundedCents,
      issuedAt: new Date(),
      paidAt: invoiceDemo.status === 'paid' || invoiceDemo.status === 'partially_refunded' ? new Date() : null
    }).returning({ id: schema.invoices.id })

    await tx.insert(schema.invoiceItems).values(itemInputs.map((input, index) => ({
      invoiceId: invoice.id,
      itemType: input.item.itemType,
      serviceId: input.serviceId,
      staffId: input.staffId,
      name: input.item.serviceName ?? input.item.name,
      description: null,
      quantity: input.item.quantity,
      unitPriceCents: input.item.unitPriceCents,
      lineTotalCents: input.lineTotalCents,
      commissionRateBps: input.commissionRateBps,
      commissionCents: totals.itemCommissions[index],
      sortOrder: input.sortOrder
    })))

    const insertedPayments = [] as Array<{ id: string }>
    for (const payment of invoiceDemo.payments) {
      const [insertedPayment] = await tx.insert(schema.payments).values({
        invoiceId: invoice.id,
        method: payment.method,
        amountCents: payment.amountCents,
        reference: payment.reference ?? null,
        note: null,
        paidAt: new Date()
      }).returning({ id: schema.payments.id })
      insertedPayments.push(insertedPayment)
    }

    for (const refund of invoiceDemo.refunds) {
      await tx.insert(schema.refunds).values({
        invoiceId: invoice.id,
        paymentId: insertedPayments[0]?.id ?? null,
        method: refund.method,
        amountCents: refund.amountCents,
        reason: refund.reason,
        refundedAt: new Date()
      })
    }
  })
}
```

Define local TypeScript types in `seed-data.ts` so `method` and `status` use the shared finance enums from Task 1.

- [ ] **Step 5: Run seed data test and seed command**

Run:

```bash
docker run --rm -v "$PWD":/workspace -w /workspace node:22-bookworm-slim bash -lc 'cd apps/api && node ../../node_modules/vitest/vitest.mjs run src/db/seed-data.test.ts'
docker compose run --rm tooling bun --filter @nailly/api db:seed
```

Expected: tests PASS and seed output includes inserted demo finance invoices/payments/refunds.

- [ ] **Step 6: Commit**

```bash
git add apps/api/src/db/seed-data.ts apps/api/src/db/seed-data.test.ts apps/api/src/db/seed.ts
git commit -m "feat: seed finance demo data"
```

---

### Task 5: Finance Repository and Service

**Files:**
- Create: `apps/api/src/repositories/finance.repository.ts`
- Create: `apps/api/src/services/finance.service.ts`
- Create: `apps/api/src/services/finance.service.test.ts`

- [ ] **Step 1: Write failing finance service tests**

Create `apps/api/src/services/finance.service.test.ts`:

```ts
import { describe, expect, it, vi } from 'vitest'
import { ApiError } from '../http/errors'
import { createFinanceService } from './finance.service'

function createRepository() {
  return {
    getFinanceSettings: vi.fn().mockResolvedValue({ taxRateBps: 825, invoicePrefix: 'INV' }),
    getServiceById: vi.fn().mockResolvedValue({ id: 'svc-1', name: 'Gel Manicure', priceCents: 5800 }),
    getStaffById: vi.fn().mockResolvedValue({ id: 'staff-1', commissionRateBps: 4500 }),
    createInvoice: vi.fn().mockResolvedValue({ id: 'invoice-1', invoiceNumber: 'INV-000001', status: 'open' }),
    getInvoiceWithItems: vi.fn(),
    addPayment: vi.fn(),
    addRefund: vi.fn(),
    voidInvoice: vi.fn()
  }
}

describe('createFinanceService', () => {
  it('creates walk-in invoices with tax and commission snapshots', async () => {
    const repository = createRepository()
    const service = createFinanceService(repository)

    await service.createInvoice({
      source: 'walk_in',
      customerName: 'Olivia Carter',
      customerPhone: '+1 555 0100',
      items: [
        {
          itemType: 'service',
          serviceId: 'svc-1',
          staffId: 'staff-1',
          name: 'Gel Manicure',
          quantity: 1,
          unitPriceCents: 5800
        }
      ],
      discountCents: 0,
      tipCents: 1000
    }, { adminUserId: 'admin-1' })

    expect(repository.createInvoice).toHaveBeenCalledWith(
      expect.objectContaining({
        totalCents: 7279,
        taxCents: 479,
        items: [
          expect.objectContaining({
            commissionRateBps: 4500,
            commissionCents: 2610
          })
        ]
      })
    )
  })

  it('rejects refunds larger than the refundable balance', async () => {
    const repository = createRepository()
    repository.getInvoiceWithItems.mockResolvedValue({
      id: 'invoice-1',
      status: 'paid',
      paidCents: 1000,
      refundedCents: 200,
      totalCents: 1000
    })
    const service = createFinanceService(repository)

    await expect(
      service.refundInvoice('invoice-1', {
        amountCents: 900,
        method: 'cash',
        reason: 'Too much'
      }, { adminUserId: 'admin-1' })
    ).rejects.toBeInstanceOf(ApiError)
  })
})
```

- [ ] **Step 2: Run service test to verify RED**

Run:

```bash
docker run --rm -v "$PWD":/workspace -w /workspace node:22-bookworm-slim bash -lc 'cd apps/api && node ../../node_modules/vitest/vitest.mjs run src/services/finance.service.test.ts'
```

Expected: FAIL because `finance.service.ts` does not exist.

- [ ] **Step 3: Implement finance service**

Create `apps/api/src/services/finance.service.ts`:

```ts
import {
  invoiceCreateSchema,
  invoicePaymentSchema,
  invoiceRefundSchema,
  type InvoiceCreateInput,
  type InvoicePaymentInput,
  type InvoiceRefundInput
} from '@nailly/shared'
import { ApiError } from '../http/errors'
import { calculateInvoiceTotals } from './finance-math'

interface FinanceRepository {
  getFinanceSettings(): Promise<{ taxRateBps: number; invoicePrefix: string }>
  getServiceById(id: string): Promise<{ id: string; name: string; priceCents: number } | null>
  getStaffById(id: string): Promise<{ id: string; commissionRateBps: number } | null>
  createInvoice(input: Record<string, unknown>): Promise<unknown>
  getInvoiceWithItems(id: string): Promise<any | null>
  addPayment(invoiceId: string, input: Record<string, unknown>): Promise<unknown>
  addRefund(invoiceId: string, input: Record<string, unknown>): Promise<unknown>
  voidInvoice(invoiceId: string, input: { reason: string; adminUserId: string }): Promise<unknown>
}

interface FinanceActor {
  adminUserId: string
}

export function createFinanceService(repository: FinanceRepository) {
  return {
    async createInvoice(input: InvoiceCreateInput, actor: FinanceActor) {
      const parsed = invoiceCreateSchema.parse(input)
      const settings = await repository.getFinanceSettings()

      const items = await Promise.all(parsed.items.map(async (item, index) => {
        const staffRow = item.staffId ? await repository.getStaffById(item.staffId) : null
        if (item.staffId && !staffRow) {
          throw new ApiError(400, 'invalid_staff', 'Assigned staff was not found.')
        }

        const serviceRow = item.serviceId ? await repository.getServiceById(item.serviceId) : null
        if (item.itemType === 'service' && item.serviceId && !serviceRow) {
          throw new ApiError(400, 'invalid_service', 'Service was not found.')
        }

        return {
          ...item,
          name: item.name || serviceRow?.name || 'Manual item',
          unitPriceCents: item.unitPriceCents,
          lineTotalCents: item.quantity * item.unitPriceCents,
          commissionRateBps: staffRow?.commissionRateBps ?? 0,
          sortOrder: index + 1
        }
      }))

      const totals = calculateInvoiceTotals({
        items: items.map((item) => ({
          quantity: item.quantity,
          unitPriceCents: item.unitPriceCents,
          commissionRateBps: item.commissionRateBps
        })),
        discountCents: parsed.discountCents,
        taxRateBps: settings.taxRateBps,
        tipCents: parsed.tipCents,
        paidCents: 0,
        refundedCents: 0
      })

      return repository.createInvoice({
        ...parsed,
        createdBy: actor.adminUserId,
        taxRateBps: settings.taxRateBps,
        ...totals,
        items: items.map((item, index) => ({
          ...item,
          commissionCents: totals.itemCommissions[index]
        }))
      })
    },

    async addPayment(invoiceId: string, input: InvoicePaymentInput, actor: FinanceActor) {
      const parsed = invoicePaymentSchema.parse(input)
      return repository.addPayment(invoiceId, { ...parsed, createdBy: actor.adminUserId })
    },

    async refundInvoice(invoiceId: string, input: InvoiceRefundInput, actor: FinanceActor) {
      const parsed = invoiceRefundSchema.parse(input)
      const invoice = await repository.getInvoiceWithItems(invoiceId)
      if (!invoice) throw new ApiError(404, 'not_found', 'Invoice not found.')

      const refundableCents = invoice.paidCents - invoice.refundedCents
      if (parsed.amountCents > refundableCents) {
        throw new ApiError(400, 'refund_too_large', 'Refund exceeds the refundable balance.')
      }

      return repository.addRefund(invoiceId, { ...parsed, createdBy: actor.adminUserId })
    },

    async voidInvoice(invoiceId: string, reason: string, actor: FinanceActor) {
      const invoice = await repository.getInvoiceWithItems(invoiceId)
      if (!invoice) throw new ApiError(404, 'not_found', 'Invoice not found.')
      if (invoice.paidCents > 0) {
        throw new ApiError(400, 'cannot_void_paid_invoice', 'Paid invoices must be refunded instead of voided.')
      }
      return repository.voidInvoice(invoiceId, { reason, adminUserId: actor.adminUserId })
    }
  }
}
```

- [ ] **Step 4: Implement finance repository**

Create `apps/api/src/repositories/finance.repository.ts` with actual Drizzle calls. Start with the methods the service needs:

```ts
import { desc, eq, sql } from 'drizzle-orm'
import { createDb } from '../db/client'
import {
  invoices,
  invoiceItems,
  payments,
  refunds,
  services,
  shopSettings,
  staff
} from '../db/schema'

export function createFinanceRepository(databaseUrl?: string) {
  const { db } = createDb(databaseUrl)

  async function nextInvoiceNumber(prefix: string) {
    const rows = await db.select({ id: invoices.id }).from(invoices)
    return `${prefix}-${String(rows.length + 1).padStart(6, '0')}`
  }

  return {
    async getFinanceSettings() {
      const row = await db.select().from(shopSettings).limit(1).then((rows) => rows[0])
      return {
        taxRateBps: row?.taxRateBps ?? 0,
        invoicePrefix: row?.invoicePrefix ?? 'INV'
      }
    },

    async getServiceById(id: string) {
      return db.select().from(services).where(eq(services.id, id)).limit(1).then((rows) => rows[0] ?? null)
    },

    async getStaffById(id: string) {
      return db.select().from(staff).where(eq(staff.id, id)).limit(1).then((rows) => rows[0] ?? null)
    },

    async createInvoice(input: any) {
      const settings = await this.getFinanceSettings()
      return db.transaction(async (tx) => {
        const [invoice] = await tx.insert(invoices).values({
          invoiceNumber: await nextInvoiceNumber(settings.invoicePrefix),
          source: input.source,
          bookingId: input.bookingId ?? null,
          customerName: input.customerName,
          customerPhone: input.customerPhone || null,
          customerEmail: input.customerEmail || null,
          status: 'open',
          subtotalCents: input.subtotalCents,
          discountCents: input.discountCents,
          discountReason: input.discountReason || null,
          taxRateBps: input.taxRateBps,
          taxCents: input.taxCents,
          tipCents: input.tipCents,
          totalCents: input.totalCents,
          paidCents: 0,
          refundedCents: 0,
          issuedAt: new Date(),
          createdBy: input.createdBy,
          updatedBy: input.createdBy
        }).returning()

        await tx.insert(invoiceItems).values(input.items.map((item: any) => ({
          invoiceId: invoice.id,
          itemType: item.itemType,
          serviceId: item.serviceId ?? null,
          staffId: item.staffId ?? null,
          name: item.name,
          description: item.description || null,
          quantity: item.quantity,
          unitPriceCents: item.unitPriceCents,
          lineTotalCents: item.lineTotalCents,
          commissionRateBps: item.commissionRateBps,
          commissionCents: item.commissionCents,
          sortOrder: item.sortOrder
        })))

        return invoice
      })
    },

    async getInvoiceWithItems(id: string) {
      const invoice = await db.select().from(invoices).where(eq(invoices.id, id)).limit(1).then((rows) => rows[0] ?? null)
      if (!invoice) return null
      const items = await db.select().from(invoiceItems).where(eq(invoiceItems.invoiceId, id))
      const paymentRows = await db.select().from(payments).where(eq(payments.invoiceId, id))
      const refundRows = await db.select().from(refunds).where(eq(refunds.invoiceId, id))
      return { ...invoice, items, payments: paymentRows, refunds: refundRows }
    },

    async addPayment(invoiceId: string, input: any) {
      return db.transaction(async (tx) => {
        const [payment] = await tx.insert(payments).values({
          invoiceId,
          method: input.method,
          amountCents: input.amountCents,
          reference: input.reference || null,
          note: input.note || null,
          paidAt: input.paidAt ? new Date(input.paidAt) : new Date(),
          createdBy: input.createdBy
        }).returning()

        await tx.update(invoices).set({
          paidCents: sql`${invoices.paidCents} + ${input.amountCents}`,
          status: 'paid',
          paidAt: new Date(),
          updatedAt: new Date(),
          updatedBy: input.createdBy
        }).where(eq(invoices.id, invoiceId))

        return payment
      })
    },

    async addRefund(invoiceId: string, input: any) {
      return db.transaction(async (tx) => {
        const [refund] = await tx.insert(refunds).values({
          invoiceId,
          paymentId: input.paymentId ?? null,
          method: input.method,
          amountCents: input.amountCents,
          reason: input.reason,
          refundedAt: input.refundedAt ? new Date(input.refundedAt) : new Date(),
          createdBy: input.createdBy
        }).returning()

        await tx.update(invoices).set({
          refundedCents: sql`${invoices.refundedCents} + ${input.amountCents}`,
          status: 'partially_refunded',
          updatedAt: new Date(),
          updatedBy: input.createdBy
        }).where(eq(invoices.id, invoiceId))

        return refund
      })
    },

    async voidInvoice(invoiceId: string, input: { reason: string; adminUserId: string }) {
      const [invoice] = await db.update(invoices).set({
        status: 'void',
        voidReason: input.reason,
        voidedAt: new Date(),
        updatedAt: new Date(),
        updatedBy: input.adminUserId
      }).where(eq(invoices.id, invoiceId)).returning()
      return invoice ?? null
    },

    async listInvoices() {
      return db.select().from(invoices).orderBy(desc(invoices.createdAt))
    }
  }
}
```

This implementation intentionally starts with payment status transitions that will be tightened in Task 11 when refund status handling is added.

- [ ] **Step 5: Run service test to verify GREEN**

Run:

```bash
docker run --rm -v "$PWD":/workspace -w /workspace node:22-bookworm-slim bash -lc 'cd apps/api && node ../../node_modules/vitest/vitest.mjs run src/services/finance.service.test.ts'
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add apps/api/src/repositories/finance.repository.ts apps/api/src/services/finance.service.ts apps/api/src/services/finance.service.test.ts
git commit -m "feat: add finance service and repository"
```

---

### Task 6: Admin Finance API Routes

**Files:**
- Modify: `apps/api/src/routes/admin.ts`
- Create: `apps/api/src/routes/finance.test.ts`

- [ ] **Step 1: Write failing route tests**

Create `apps/api/src/routes/finance.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { adminRoutes } from './admin'

describe('admin finance routes', () => {
  it('exposes the admin route factory after finance routes are mounted', () => {
    expect(typeof adminRoutes).toBe('function')
  })
})
```

This is a smoke test because auth middleware requires signed cookies. Endpoint behavior is covered in `finance.service.test.ts`.

- [ ] **Step 2: Run route tests**

Run:

```bash
docker run --rm -v "$PWD":/workspace -w /workspace node:22-bookworm-slim bash -lc 'cd apps/api && node ../../node_modules/vitest/vitest.mjs run src/routes/finance.test.ts'
```

Expected: PASS before route implementation; this confirms the test harness. Continue to route implementation and verify TypeScript/lint catches integration errors.

- [ ] **Step 3: Mount finance routes in admin router**

In `apps/api/src/routes/admin.ts`, import:

```ts
import { createFinanceRepository } from '../repositories/finance.repository'
import { createFinanceService } from '../services/finance.service'
```

Inside `adminRoutes`, create finance service:

```ts
const financeService = createFinanceService(createFinanceRepository())
```

Add routes before `return router`:

```ts
router.get('/invoices', guard('manager'), async (c) => {
  const result = await createFinanceRepository().listInvoices()
  return c.json(result)
})

router.post('/invoices', guard('staff'), async (c) => {
  const body = await c.req.json()
  const user = c.get('adminUser')
  const result = await financeService.createInvoice(body, { adminUserId: user.id })
  return c.json(result, 201)
})

router.get('/invoices/:id', guard('staff'), async (c) => {
  const invoice = await createFinanceRepository().getInvoiceWithItems(c.req.param('id'))
  if (!invoice) {
    return errorResponse(c, new ApiError(404, 'not_found', 'Invoice not found.'))
  }
  return c.json(invoice)
})

router.post('/invoices/:id/payments', guard('staff'), async (c) => {
  const user = c.get('adminUser')
  const result = await financeService.addPayment(c.req.param('id'), await c.req.json(), { adminUserId: user.id })
  return c.json(result, 201)
})

router.post('/invoices/:id/refunds', guard('manager'), async (c) => {
  const user = c.get('adminUser')
  const result = await financeService.refundInvoice(c.req.param('id'), await c.req.json(), { adminUserId: user.id })
  return c.json(result, 201)
})

router.post('/invoices/:id/void', guard('manager'), async (c) => {
  const user = c.get('adminUser')
  const { reason } = await c.req.json<{ reason: string }>()
  const result = await financeService.voidInvoice(c.req.param('id'), reason, { adminUserId: user.id })
  return c.json(result)
})
```

Then refactor repeated `createFinanceRepository()` calls into one `financeRepository` constant inside `adminRoutes`.

- [ ] **Step 4: Run API tests and lint**

Run:

```bash
docker run --rm -v "$PWD":/workspace -w /workspace node:22-bookworm-slim bash -lc 'cd apps/api && node ../../node_modules/vitest/vitest.mjs run'
docker compose run --rm tooling bun --filter @nailly/api lint
```

Expected: tests PASS, lint exits 0.

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/routes/admin.ts apps/api/src/routes/finance.test.ts
git commit -m "feat: expose admin finance api"
```

---

### Task 7: Staff Commission and Finance Settings UI/API

**Files:**
- Modify: `apps/api/src/repositories/admin.repository.ts`
- Modify: `apps/web/pages/admin/staff.vue`
- Modify: `apps/web/pages/admin/settings.vue`
- Modify: `apps/web/tests/admin-staff-table.test.ts`
- Modify: `apps/web/tests/admin-settings.test.ts`

- [ ] **Step 1: Extend existing admin tests**

In `apps/web/tests/admin-staff-table.test.ts`, add a helper expectation that a staff row can carry `commissionRateBps`:

```ts
it('keeps staff commission rate available for finance views', () => {
  expect(staffRows[0].commissionRateBps).toBe(4500)
})
```

Update the test fixture to include `commissionRateBps: 4500`.

In `apps/web/tests/admin-settings.test.ts`, add:

```ts
it('formats finance settings for tax and receipt defaults', () => {
  expect(formatTaxRate(825)).toBe('8.25%')
  expect(formatTaxRate(0)).toBe('0.00%')
})
```

- [ ] **Step 2: Run tests to verify RED**

Run:

```bash
docker run --rm -v "$PWD":/workspace -w /workspace node:22-bookworm-slim bash -lc 'cd apps/web && node ../../node_modules/vitest/vitest.mjs run tests/admin-staff-table.test.ts tests/admin-settings.test.ts'
```

Expected: FAIL until fixtures/helpers are updated.

- [ ] **Step 3: Update staff/settings API persistence**

In `apps/api/src/repositories/admin.repository.ts`, allow `commissionRateBps` in staff create/update input and finance fields in settings update. The existing `Record<string, unknown>` update paths already accept fields; update create type:

```ts
async createStaff(input: { name: string; title: string; bio: string; commissionRateBps?: number }) {
  const [row] = await db.insert(staff).values(input).returning()
  return row
}
```

- [ ] **Step 4: Update web settings helper**

If `apps/web/utils/admin-settings.ts` exists, add:

```ts
export function formatTaxRate(taxRateBps: number) {
  return `${(taxRateBps / 100).toFixed(2)}%`
}
```

- [ ] **Step 5: Update staff/settings pages**

In `apps/web/pages/admin/staff.vue`:

- Add `commissionRateBps` to `AdminStaff`.
- Add `commissionRateBps: 4000` to the form defaults.
- Add a compact input labeled `Commission %`.
- Convert percent to basis points with `Math.round(percent * 100)` before submit.
- Display commission in the staff table as `45.00%`.

In `apps/web/pages/admin/settings.vue`:

- Add finance section fields:
  - `taxRateBps`
  - `invoicePrefix`
  - `receiptFooter`
- Use `formatTaxRate` in preview/status copy.
- Submit these fields through existing `/admin/shop-settings`.

- [ ] **Step 6: Run tests and lint**

Run:

```bash
docker run --rm -v "$PWD":/workspace -w /workspace node:22-bookworm-slim bash -lc 'cd apps/web && node ../../node_modules/vitest/vitest.mjs run tests/admin-staff-table.test.ts tests/admin-settings.test.ts'
docker compose run --rm tooling bun --filter @nailly/web lint
```

Expected: tests PASS, lint exits 0.

- [ ] **Step 7: Commit**

```bash
git add apps/api/src/repositories/admin.repository.ts apps/web/pages/admin/staff.vue apps/web/pages/admin/settings.vue apps/web/utils/admin-settings.ts apps/web/tests/admin-staff-table.test.ts apps/web/tests/admin-settings.test.ts
git commit -m "feat: add finance staff and settings fields"
```

---

### Task 8: Web Finance Utilities and Admin Navigation

**Files:**
- Modify: `apps/web/utils/admin-nav.ts`
- Create: `apps/web/utils/finance-format.ts`
- Create: `apps/web/utils/finance-calculator.ts`
- Create: `apps/web/tests/finance-format.test.ts`
- Create: `apps/web/tests/finance-calculator.test.ts`

- [ ] **Step 1: Write failing web finance utility tests**

Create `apps/web/tests/finance-format.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { getInvoiceStatusLabel, getPaymentMethodLabel } from '../utils/finance-format'

describe('finance format helpers', () => {
  it('formats invoice status labels', () => {
    expect(getInvoiceStatusLabel('partially_refunded')).toBe('Partially refunded')
    expect(getInvoiceStatusLabel('paid')).toBe('Paid')
  })

  it('formats payment method labels', () => {
    expect(getPaymentMethodLabel('credit_card')).toBe('Credit card')
    expect(getPaymentMethodLabel('gift_card')).toBe('Gift card')
  })
})
```

Create `apps/web/tests/finance-calculator.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { calculateDraftInvoiceTotals } from '../utils/finance-calculator'

describe('calculateDraftInvoiceTotals', () => {
  it('matches fixed tax and tip calculations for POS drafts', () => {
    expect(
      calculateDraftInvoiceTotals({
        items: [
          { quantity: 1, unitPriceCents: 5800 },
          { quantity: 1, unitPriceCents: 1800 }
        ],
        discountCents: 500,
        taxRateBps: 825,
        tipCents: 1000
      })
    ).toEqual({
      subtotalCents: 7600,
      discountCents: 500,
      taxCents: 586,
      tipCents: 1000,
      totalCents: 8686
    })
  })
})
```

- [ ] **Step 2: Run tests to verify RED**

Run:

```bash
docker run --rm -v "$PWD":/workspace -w /workspace node:22-bookworm-slim bash -lc 'cd apps/web && node ../../node_modules/vitest/vitest.mjs run tests/finance-format.test.ts tests/finance-calculator.test.ts'
```

Expected: FAIL because helper files do not exist.

- [ ] **Step 3: Add finance helpers**

Create `apps/web/utils/finance-format.ts`:

```ts
export function getInvoiceStatusLabel(status: string) {
  const labels: Record<string, string> = {
    draft: 'Draft',
    open: 'Open',
    paid: 'Paid',
    partially_refunded: 'Partially refunded',
    refunded: 'Refunded',
    void: 'Void'
  }
  return labels[status] ?? status
}

export function getPaymentMethodLabel(method: string) {
  const labels: Record<string, string> = {
    cash: 'Cash',
    credit_card: 'Credit card',
    debit_card: 'Debit card',
    zelle: 'Zelle',
    venmo: 'Venmo',
    gift_card: 'Gift card',
    other: 'Other'
  }
  return labels[method] ?? method
}

export function formatPercentBps(value: number) {
  return `${(value / 100).toFixed(2)}%`
}
```

Create `apps/web/utils/finance-calculator.ts`:

```ts
export interface DraftInvoiceItem {
  quantity: number
  unitPriceCents: number
}

export function calculateDraftInvoiceTotals(input: {
  items: DraftInvoiceItem[]
  discountCents: number
  taxRateBps: number
  tipCents: number
}) {
  const subtotalCents = input.items.reduce(
    (sum, item) => sum + Math.max(0, Math.trunc(item.quantity)) * Math.max(0, Math.trunc(item.unitPriceCents)),
    0
  )
  const discountCents = Math.min(Math.max(0, Math.trunc(input.discountCents)), subtotalCents)
  const taxCents = Math.round(((subtotalCents - discountCents) * Math.max(0, Math.trunc(input.taxRateBps))) / 10000)
  const tipCents = Math.max(0, Math.trunc(input.tipCents))

  return {
    subtotalCents,
    discountCents,
    taxCents,
    tipCents,
    totalCents: subtotalCents - discountCents + taxCents + tipCents
  }
}
```

Modify `apps/web/utils/admin-nav.ts`:

```ts
{ label: 'POS', to: '/admin/pos', minRole: 'staff' },
{ label: 'Invoices', to: '/admin/invoices', minRole: 'staff' },
{ label: 'Reports', to: '/admin/reports', minRole: 'manager' },
```

Place these near `Bookings`.

- [ ] **Step 4: Run tests to verify GREEN**

Run:

```bash
docker run --rm -v "$PWD":/workspace -w /workspace node:22-bookworm-slim bash -lc 'cd apps/web && node ../../node_modules/vitest/vitest.mjs run tests/finance-format.test.ts tests/finance-calculator.test.ts tests/admin-nav.test.ts'
```

Expected: PASS. Update `admin-nav.test.ts` expected labels to include new nav items by role.

- [ ] **Step 5: Commit**

```bash
git add apps/web/utils/admin-nav.ts apps/web/utils/finance-format.ts apps/web/utils/finance-calculator.ts apps/web/tests/finance-format.test.ts apps/web/tests/finance-calculator.test.ts apps/web/tests/admin-nav.test.ts
git commit -m "feat: add web finance helpers and nav"
```

---

### Task 9: POS Page and Booking Checkout Action

**Files:**
- Create: `apps/web/pages/admin/pos.vue`
- Modify: `apps/web/pages/admin/bookings.vue`

- [ ] **Step 1: Add POS page**

Create `apps/web/pages/admin/pos.vue` with this structure:

```vue
<template>
  <AdminShell>
    <div class="admin-page-header">
      <div>
        <p class="eyebrow">POS</p>
        <h1>Checkout</h1>
        <p>Create a walk-in invoice or finish a booked appointment.</p>
      </div>
      <button class="btn-primary" type="button" @click="createInvoice">Save invoice</button>
    </div>

    <div class="pos-layout">
      <section class="surface-panel pos-services">
        <h2>Services</h2>
        <input v-model="serviceSearch" class="form-control" type="search" placeholder="Search services" />
        <button
          v-for="service in filteredServices"
          :key="service.id"
          class="service-pick-row"
          type="button"
          @click="addService(service)"
        >
          <span>{{ service.name }}</span>
          <strong>{{ formatPrice(service.priceCents) }}</strong>
        </button>
      </section>

      <section class="surface-panel pos-ticket">
        <h2>Invoice items</h2>
        <div v-for="(item, index) in items" :key="index" class="ticket-row">
          <input v-model="item.name" class="form-control" />
          <select v-model="item.staffId" class="form-control">
            <option :value="null">No staff</option>
            <option v-for="person in staff" :key="person.id" :value="person.id">{{ person.name }}</option>
          </select>
          <input v-model.number="item.quantity" class="form-control" type="number" min="1" />
          <input v-model.number="item.unitPriceCents" class="form-control" type="number" min="0" />
        </div>
        <button class="btn-secondary" type="button" @click="addManualItem">Add manual item</button>
      </section>

      <aside class="surface-panel pos-summary">
        <h2>Total</h2>
        <dl>
          <div><dt>Subtotal</dt><dd>{{ formatPrice(totals.subtotalCents) }}</dd></div>
          <div><dt>Discount</dt><dd>{{ formatPrice(totals.discountCents) }}</dd></div>
          <div><dt>Tax</dt><dd>{{ formatPrice(totals.taxCents) }}</dd></div>
          <div><dt>Tip</dt><dd>{{ formatPrice(totals.tipCents) }}</dd></div>
          <div><dt>Total</dt><dd>{{ formatPrice(totals.totalCents) }}</dd></div>
        </dl>
        <input v-model.number="discountCents" class="form-control" type="number" min="0" placeholder="Discount cents" />
        <input v-model.number="tipCents" class="form-control" type="number" min="0" placeholder="Tip cents" />
      </aside>
    </div>
  </AdminShell>
</template>
```

Use script setup:

```ts
import { formatPrice } from '../../utils/format'
import { calculateDraftInvoiceTotals } from '../../utils/finance-calculator'

const config = useRuntimeConfig()
const baseUrl = config.public.apiBaseUrl

const services = ref<Array<{ id: string; name: string; priceCents: number }>>([])
const staff = ref<Array<{ id: string; name: string }>>([])
const serviceSearch = ref('')
const discountCents = ref(0)
const tipCents = ref(0)
const taxRateBps = ref(825)
const items = ref<Array<{
  itemType: 'service' | 'manual'
  serviceId: string | null
  staffId: string | null
  name: string
  quantity: number
  unitPriceCents: number
}>>([])

const filteredServices = computed(() => {
  const query = serviceSearch.value.trim().toLowerCase()
  return services.value.filter((service) => !query || service.name.toLowerCase().includes(query))
})

const totals = computed(() => calculateDraftInvoiceTotals({
  items: items.value,
  discountCents: discountCents.value,
  taxRateBps: taxRateBps.value,
  tipCents: tipCents.value
}))

function addService(service: { id: string; name: string; priceCents: number }) {
  items.value.push({
    itemType: 'service',
    serviceId: service.id,
    staffId: null,
    name: service.name,
    quantity: 1,
    unitPriceCents: service.priceCents
  })
}

function addManualItem() {
  items.value.push({
    itemType: 'manual',
    serviceId: null,
    staffId: null,
    name: 'Manual item',
    quantity: 1,
    unitPriceCents: 0
  })
}

async function loadData() {
  const [serviceRows, staffRows, settings] = await Promise.all([
    $fetch<Array<{ id: string; name: string; priceCents: number }>>(`${baseUrl}/admin/services`, { credentials: 'include' }),
    $fetch<Array<{ id: string; name: string }>>(`${baseUrl}/admin/staff`, { credentials: 'include' }),
    $fetch<{ taxRateBps?: number }>(`${baseUrl}/admin/shop-settings`, { credentials: 'include' })
  ])
  services.value = serviceRows
  staff.value = staffRows
  taxRateBps.value = settings.taxRateBps ?? 825
}

async function createInvoice() {
  await $fetch(`${baseUrl}/admin/invoices`, {
    method: 'POST',
    credentials: 'include',
    body: {
      source: 'walk_in',
      customerName: 'Walk-in customer',
      items: items.value,
      discountCents: discountCents.value,
      tipCents: tipCents.value
    }
  })
}

onMounted(loadData)
```

Add scoped CSS using existing admin page patterns. Keep panels not nested and use responsive single-column under `900px`.

- [ ] **Step 2: Add Checkout action in bookings**

In `apps/web/pages/admin/bookings.vue`, add a `Checkout` button for `confirmed` and `completed` bookings:

```vue
<NuxtLink
  v-if="b.status === 'confirmed' || b.status === 'completed'"
  class="btn-secondary table-action"
  :to="`/admin/pos?bookingId=${b.id}`"
>
  Checkout
</NuxtLink>
```

- [ ] **Step 3: Run lint and smoke**

Run:

```bash
docker compose run --rm tooling bun --filter @nailly/web lint
curl -sS -I http://localhost:3000/admin/pos
```

Expected: lint exits 0 and `/admin/pos` returns a Nuxt response. If unauthenticated redirect middleware applies, HTTP 200 login shell or 302 is acceptable; page compile must not error.

- [ ] **Step 4: Commit**

```bash
git add apps/web/pages/admin/pos.vue apps/web/pages/admin/bookings.vue
git commit -m "feat: add admin pos checkout page"
```

---

### Task 10: Invoice List and Detail Pages

**Files:**
- Create: `apps/web/utils/invoice-table.ts`
- Create: `apps/web/tests/invoice-table.test.ts`
- Create: `apps/web/pages/admin/invoices.vue`
- Create: `apps/web/pages/admin/invoices/[id].vue`

- [ ] **Step 1: Write invoice table helper tests**

Create `apps/web/tests/invoice-table.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { filterInvoices, paginateInvoices } from '../utils/invoice-table'

const invoices = [
  { id: '1', invoiceNumber: 'INV-001', customerName: 'Olivia Carter', status: 'paid', source: 'booking' },
  { id: '2', invoiceNumber: 'INV-002', customerName: 'Avery Stone', status: 'open', source: 'walk_in' },
  { id: '3', invoiceNumber: 'INV-003', customerName: 'Mia Thompson', status: 'refunded', source: 'walk_in' }
]

describe('invoice table helpers', () => {
  it('filters invoices by search, status, and source', () => {
    expect(filterInvoices(invoices, { searchQuery: 'olivia', status: 'all', source: 'all' }).map((row) => row.id)).toEqual(['1'])
    expect(filterInvoices(invoices, { searchQuery: '', status: 'refunded', source: 'walk_in' }).map((row) => row.id)).toEqual(['3'])
  })

  it('paginates invoices', () => {
    expect(paginateInvoices(invoices, 1, 2).items.map((row) => row.id)).toEqual(['1', '2'])
    expect(paginateInvoices(invoices, 2, 2).items.map((row) => row.id)).toEqual(['3'])
  })
})
```

- [ ] **Step 2: Run tests to verify RED**

Run:

```bash
docker run --rm -v "$PWD":/workspace -w /workspace node:22-bookworm-slim bash -lc 'cd apps/web && node ../../node_modules/vitest/vitest.mjs run tests/invoice-table.test.ts'
```

Expected: FAIL because helper does not exist.

- [ ] **Step 3: Implement invoice table helpers**

Create `apps/web/utils/invoice-table.ts`:

```ts
export type InvoiceStatusFilter = 'all' | string
export type InvoiceSourceFilter = 'all' | string

export interface InvoiceTableRow {
  id: string
  invoiceNumber: string
  customerName: string
  status: string
  source: string
}

export function filterInvoices<TInvoice extends InvoiceTableRow>(
  invoices: TInvoice[],
  filters: { searchQuery: string; status: InvoiceStatusFilter; source: InvoiceSourceFilter }
) {
  const query = filters.searchQuery.trim().toLowerCase()
  return invoices.filter((invoice) => {
    const matchesSearch = !query || [invoice.invoiceNumber, invoice.customerName]
      .some((value) => value.toLowerCase().includes(query))
    const matchesStatus = filters.status === 'all' || invoice.status === filters.status
    const matchesSource = filters.source === 'all' || invoice.source === filters.source
    return matchesSearch && matchesStatus && matchesSource
  })
}

export function paginateInvoices<TInvoice>(invoices: TInvoice[], currentPage: number, pageSize: number) {
  const safePageSize = Math.max(1, Math.trunc(pageSize) || 10)
  const totalItems = invoices.length
  const totalPages = Math.max(1, Math.ceil(totalItems / safePageSize))
  const safeCurrentPage = Math.min(Math.max(1, Math.trunc(currentPage) || 1), totalPages)
  const startIndex = (safeCurrentPage - 1) * safePageSize
  const endIndex = Math.min(startIndex + safePageSize, totalItems)
  return {
    items: invoices.slice(startIndex, endIndex),
    currentPage: safeCurrentPage,
    totalPages,
    totalItems,
    startItem: totalItems ? startIndex + 1 : 0,
    endItem: endIndex
  }
}
```

- [ ] **Step 4: Add invoice list/detail pages**

Create `apps/web/pages/admin/invoices.vue` with the same surface-panel/table/filter/pagination structure used by `staff.vue` and `services.vue`:

- Header: `Invoices`.
- Filters: search, status, source, rows.
- Table columns from the spec.
- Row action links to `/admin/invoices/${invoice.id}`.
- Pagination using `paginateInvoices`.
- Fetch from `/admin/invoices`.

Create `apps/web/pages/admin/invoices/[id].vue`:

- Fetch `/admin/invoices/:id`.
- Show header summary.
- Show line items, totals, payments, refunds.
- Buttons:
  - `Print receipt` to `/admin/invoices/${id}/receipt`
  - `Print A4` to `/admin/invoices/${id}/print`
  - `Refund`
  - `Void`
- Add compact payment form with method/amount/reference/note posting to `/admin/invoices/:id/payments`.

- [ ] **Step 5: Run tests and lint**

Run:

```bash
docker run --rm -v "$PWD":/workspace -w /workspace node:22-bookworm-slim bash -lc 'cd apps/web && node ../../node_modules/vitest/vitest.mjs run tests/invoice-table.test.ts'
docker compose run --rm tooling bun --filter @nailly/web lint
```

Expected: PASS and lint exits 0.

- [ ] **Step 6: Commit**

```bash
git add apps/web/utils/invoice-table.ts apps/web/tests/invoice-table.test.ts apps/web/pages/admin/invoices.vue apps/web/pages/admin/invoices
git commit -m "feat: add admin invoice management"
```

---

### Task 11: Print Views, Void, and Refund UI

**Files:**
- Create: `apps/web/pages/admin/invoices/[id]/receipt.vue`
- Create: `apps/web/pages/admin/invoices/[id]/print.vue`
- Modify: `apps/web/pages/admin/invoices/[id].vue`
- Modify: `apps/api/src/repositories/finance.repository.ts`

- [ ] **Step 1: Refine refund status transition**

In `apps/api/src/repositories/finance.repository.ts`, update `addRefund` to compute final status based on new refunded total:

```ts
const invoice = await tx.select().from(invoices).where(eq(invoices.id, invoiceId)).limit(1).then((rows) => rows[0])
const nextRefundedCents = invoice.refundedCents + input.amountCents
const nextStatus = nextRefundedCents >= invoice.paidCents ? 'refunded' : 'partially_refunded'
```

Use `nextStatus` in the invoice update.

- [ ] **Step 2: Add receipt print view**

Create `apps/web/pages/admin/invoices/[id]/receipt.vue`:

```vue
<template>
  <main class="receipt-page">
    <section class="receipt">
      <h1>Luma Nail Studio</h1>
      <p>{{ invoice?.invoiceNumber }}</p>
      <p>{{ invoice?.customerName }}</p>

      <div v-for="item in invoice?.items ?? []" :key="item.id" class="receipt-line">
        <span>{{ item.name }}</span>
        <strong>{{ formatPrice(item.lineTotalCents) }}</strong>
      </div>

      <div class="receipt-total">
        <span>Total</span>
        <strong>{{ formatPrice(invoice?.totalCents ?? 0) }}</strong>
      </div>
      <button class="print-button" type="button" @click="print">Print</button>
    </section>
  </main>
</template>
```

Script:

```ts
import { formatPrice } from '../../../../utils/format'

const route = useRoute()
const config = useRuntimeConfig()
const invoice = ref<any | null>(null)

function print() {
  window.print()
}

onMounted(async () => {
  invoice.value = await $fetch(`${config.public.apiBaseUrl}/admin/invoices/${route.params.id}`, {
    credentials: 'include'
  })
})
```

CSS:

```css
.receipt-page {
  background: #fff;
  color: #111;
  min-height: 100vh;
  padding: 16px;
}

.receipt {
  width: 80mm;
  margin: 0 auto;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}

.receipt h1 {
  font-size: 16px;
  text-align: center;
}

.receipt-line,
.receipt-total {
  display: flex;
  justify-content: space-between;
  border-top: 1px dashed #999;
  padding: 6px 0;
}

@media print {
  .print-button {
    display: none;
  }
}
```

- [ ] **Step 3: Add A4 print view**

Create `apps/web/pages/admin/invoices/[id]/print.vue`:

- A4 white document.
- Salon header.
- Invoice number/date/customer.
- Itemized table.
- Totals table.
- Payments/refunds section.
- `window.print()` button hidden in print.

Reuse the same fetch script as receipt.

- [ ] **Step 4: Add refund/void forms to invoice detail**

In `apps/web/pages/admin/invoices/[id].vue`:

- Add refund amount/method/reason form posting to `/admin/invoices/:id/refunds`.
- Add void reason form posting to `/admin/invoices/:id/void`.
- Hide void action when `invoice.paidCents > 0`.
- Reload invoice after actions.

- [ ] **Step 5: Run lint and smoke print pages**

Run:

```bash
docker compose run --rm tooling bun --filter @nailly/web lint
curl -sS -I http://localhost:3000/admin/invoices/demo/receipt
curl -sS -I http://localhost:3000/admin/invoices/demo/print
```

Expected: lint exits 0; routes compile and return a Nuxt response even if data fetch requires auth or invoice id is missing.

- [ ] **Step 6: Commit**

```bash
git add apps/api/src/repositories/finance.repository.ts apps/web/pages/admin/invoices
git commit -m "feat: add invoice print and refund workflows"
```

---

### Task 12: Reports and CSV Exports

**Files:**
- Modify: `apps/api/src/repositories/finance.repository.ts`
- Modify: `apps/api/src/routes/admin.ts`
- Create: `apps/api/src/services/finance-export.ts`
- Create: `apps/web/pages/admin/reports.vue`
- Create: `apps/web/tests/finance-reports.test.ts`
- Create: `apps/web/utils/finance-reports.ts`

- [ ] **Step 1: Write report helper tests**

Create `apps/web/tests/finance-reports.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { summarizeRevenue } from '../utils/finance-reports'

describe('summarizeRevenue', () => {
  it('summarizes gross, refunds, net, tax, tips, and invoice count', () => {
    expect(
      summarizeRevenue([
        { totalCents: 10000, refundedCents: 1000, taxCents: 800, tipCents: 1200 },
        { totalCents: 5000, refundedCents: 0, taxCents: 400, tipCents: 500 }
      ])
    ).toEqual({
      grossCents: 15000,
      refundedCents: 1000,
      netCents: 14000,
      taxCents: 1200,
      tipCents: 1700,
      invoiceCount: 2
    })
  })
})
```

- [ ] **Step 2: Run report helper test to verify RED**

Run:

```bash
docker run --rm -v "$PWD":/workspace -w /workspace node:22-bookworm-slim bash -lc 'cd apps/web && node ../../node_modules/vitest/vitest.mjs run tests/finance-reports.test.ts'
```

Expected: FAIL because helper does not exist.

- [ ] **Step 3: Implement web report helper**

Create `apps/web/utils/finance-reports.ts`:

```ts
export interface RevenueSummaryInvoice {
  totalCents: number
  refundedCents: number
  taxCents: number
  tipCents: number
}

export function summarizeRevenue(invoices: RevenueSummaryInvoice[]) {
  return invoices.reduce(
    (summary, invoice) => ({
      grossCents: summary.grossCents + invoice.totalCents,
      refundedCents: summary.refundedCents + invoice.refundedCents,
      netCents: summary.netCents + invoice.totalCents - invoice.refundedCents,
      taxCents: summary.taxCents + invoice.taxCents,
      tipCents: summary.tipCents + invoice.tipCents,
      invoiceCount: summary.invoiceCount + 1
    }),
    {
      grossCents: 0,
      refundedCents: 0,
      netCents: 0,
      taxCents: 0,
      tipCents: 0,
      invoiceCount: 0
    }
  )
}
```

- [ ] **Step 4: Add report repository methods**

In `apps/api/src/repositories/finance.repository.ts`, add:

```ts
async getRevenueReport() {
  const invoiceRows = await db.select().from(invoices)
  return {
    invoices: invoiceRows,
    summary: invoiceRows.reduce(
      (summary, invoice) => ({
        grossCents: summary.grossCents + invoice.totalCents,
        refundedCents: summary.refundedCents + invoice.refundedCents,
        netCents: summary.netCents + invoice.totalCents - invoice.refundedCents,
        taxCents: summary.taxCents + invoice.taxCents,
        tipCents: summary.tipCents + invoice.tipCents,
        invoiceCount: summary.invoiceCount + 1
      }),
      { grossCents: 0, refundedCents: 0, netCents: 0, taxCents: 0, tipCents: 0, invoiceCount: 0 }
    )
  }
}
```

Create `apps/api/src/services/finance-export.ts`:

```ts
function csvEscape(value: unknown) {
  const text = String(value ?? '')
  return `"${text.replace(/"/g, '""')}"`
}

export function invoicesToCsv(rows: Array<Record<string, unknown>>) {
  const headers = ['invoiceNumber', 'customerName', 'source', 'status', 'totalCents', 'paidCents', 'refundedCents']
  return [
    headers.join(','),
    ...rows.map((row) => headers.map((header) => csvEscape(row[header])).join(','))
  ].join('\n')
}
```

- [ ] **Step 5: Add report/export routes**

In `apps/api/src/routes/admin.ts`:

```ts
router.get('/reports/revenue', guard('manager'), async (c) => {
  const result = await financeRepository.getRevenueReport()
  return c.json(result)
})

router.get('/exports/invoices.csv', guard('manager'), async (c) => {
  const rows = await financeRepository.listInvoices()
  return new Response(invoicesToCsv(rows), {
    headers: {
      'content-type': 'text/csv; charset=utf-8',
      'content-disposition': 'attachment; filename="invoices.csv"'
    }
  })
})
```

Import `invoicesToCsv` from `../services/finance-export`.

- [ ] **Step 6: Build reports page**

Create `apps/web/pages/admin/reports.vue`:

- Header: `Reports`.
- Filters: date range, staff, method.
- KPI cards: Gross, Refunds, Net, Tax, Tips, Invoice count.
- Simple CSS bar sections for revenue by status/method until chart library is introduced.
- Tables for service/staff/payroll sections as returned by API.
- Export buttons linking to `/admin/exports/invoices.csv`, `/admin/exports/payments.csv`, `/admin/exports/refunds.csv`, `/admin/exports/payroll.csv`.
- Printable report button calling `window.print()`.

- [ ] **Step 7: Run tests/lint**

Run:

```bash
docker run --rm -v "$PWD":/workspace -w /workspace node:22-bookworm-slim bash -lc 'cd apps/web && node ../../node_modules/vitest/vitest.mjs run tests/finance-reports.test.ts'
docker compose run --rm tooling bun --filter @nailly/api lint
docker compose run --rm tooling bun --filter @nailly/web lint
```

Expected: tests PASS, lint exits 0.

- [ ] **Step 8: Commit**

```bash
git add apps/api/src/repositories/finance.repository.ts apps/api/src/routes/admin.ts apps/web/pages/admin/reports.vue apps/web/utils/finance-reports.ts apps/web/tests/finance-reports.test.ts
git commit -m "feat: add finance reports and exports"
```

---

### Task 13: Final Integration Verification

**Files:**
- Modify: `docs/user-manual.md`
- Modify: `README.md`

- [ ] **Step 1: Update user manual**

Add an admin finance section to `docs/user-manual.md`:

```md
## Finance Suite

Owners and managers can use the finance suite to checkout bookings, create walk-in POS invoices, record payments, print bills, issue refunds, and review reports.

### Checkout a Booking

1. Open Admin > Bookings.
2. Choose a confirmed booking.
3. Click Checkout.
4. Confirm services and assigned staff.
5. Add discount or tip when the checkout requires an adjustment.
6. Record payment method and amount.
7. Print receipt or A4 invoice.

### Walk-In POS

1. Open Admin > POS.
2. Add service or manual line items.
3. Assign staff per service line.
4. Record payment.
5. Print receipt or A4 invoice.

### Reports

Open Admin > Reports to review gross revenue, refunds, net revenue, taxes, tips, service sales, staff sales, and payroll commission. Use Export CSV for spreadsheet review.
```

- [ ] **Step 2: Update README**

Add finance smoke steps:

```md
### Finance Suite Smoke Test

1. Start the stack with `docker compose up`.
2. Seed demo data with `docker compose run --rm tooling bun --filter @nailly/api db:seed`.
3. Log in at `http://localhost:3000/admin/login`.
4. Open `/admin/pos`, create a walk-in invoice, and record payment.
5. Open `/admin/invoices`, print receipt/A4 views, and issue a partial refund.
6. Open `/admin/reports` and export invoices CSV.
```

- [ ] **Step 3: Run full verification**

Run:

```bash
docker run --rm -v "$PWD":/workspace -w /workspace node:22-bookworm-slim bash -lc 'cd packages/shared && node ../../node_modules/vitest/vitest.mjs run'
docker run --rm -v "$PWD":/workspace -w /workspace node:22-bookworm-slim bash -lc 'cd apps/api && node ../../node_modules/vitest/vitest.mjs run'
docker run --rm -v "$PWD":/workspace -w /workspace node:22-bookworm-slim bash -lc 'cd apps/web && node ../../node_modules/vitest/vitest.mjs run'
docker compose run --rm tooling bun --filter @nailly/api lint
docker compose run --rm tooling bun --filter @nailly/web lint
docker compose run --rm tooling bun --filter @nailly/api build
docker compose run --rm tooling bun --filter @nailly/web build
docker compose run --rm tooling bun --filter @nailly/api db:seed
```

Expected: all commands exit 0, and seed inserts invoice/payment/refund demo rows.

- [ ] **Step 4: Restart services and smoke routes**

Run:

```bash
docker compose restart redis api web
sleep 5
curl -sS -I http://localhost:3000/admin/pos
curl -sS -I http://localhost:3000/admin/invoices
curl -sS -I http://localhost:3000/admin/reports
curl -sS -I http://localhost:8787/health
```

Expected: Nuxt routes and API health respond without server errors.

- [ ] **Step 5: Commit docs and final verification**

```bash
git add README.md docs/user-manual.md
git commit -m "docs: document finance suite workflows"
```

Then run:

```bash
git status --short
```

Expected: only unrelated pre-existing changes remain, or the worktree is clean if this branch contains only finance work.
