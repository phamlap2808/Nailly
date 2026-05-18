<template>
  <AdminShell>
    <div class="admin-page-header">
      <div>
        <p class="eyebrow">Finance</p>
        <h1 class="display-title">Reports</h1>
        <p>Track revenue, refunds, taxes, tips, and payroll commission.</p>
      </div>
      <button class="btn-primary header-action" type="button" @click="printReport">Print report</button>
    </div>

    <section class="surface-panel report-filters">
      <label class="field">
        <span>From</span>
        <input v-model="dateFrom" class="form-control" type="date" />
      </label>
      <label class="field">
        <span>To</span>
        <input v-model="dateTo" class="form-control" type="date" />
      </label>
      <label class="field">
        <span>Staff</span>
        <select v-model="staffFilter" class="form-control">
          <option value="all">All staff</option>
          <option v-for="staff in staffOptions" :key="staff.id" :value="staff.id">{{ staff.name }}</option>
        </select>
      </label>
      <label class="field">
        <span>Payment method</span>
        <select v-model="methodFilter" class="form-control">
          <option value="all">All methods</option>
          <option v-for="method in methodOptions" :key="method" :value="method">
            {{ getPaymentMethodLabel(method) }}
          </option>
        </select>
      </label>
    </section>

    <div v-if="loading" class="surface-panel loading-state">Loading reports...</div>

    <template v-else>
      <section class="kpi-grid" aria-label="Revenue summary">
        <article class="kpi-card">
          <span>Gross</span>
          <strong>{{ formatPrice(summary.grossCents) }}</strong>
        </article>
        <article class="kpi-card">
          <span>Refunds</span>
          <strong>{{ formatPrice(summary.refundedCents) }}</strong>
        </article>
        <article class="kpi-card">
          <span>Net</span>
          <strong>{{ formatPrice(summary.netCents) }}</strong>
        </article>
        <article class="kpi-card">
          <span>Tax</span>
          <strong>{{ formatPrice(summary.taxCents) }}</strong>
        </article>
        <article class="kpi-card">
          <span>Tips</span>
          <strong>{{ formatPrice(summary.tipCents) }}</strong>
        </article>
        <article class="kpi-card">
          <span>Invoices</span>
          <strong>{{ summary.invoiceCount }}</strong>
        </article>
      </section>

      <section class="surface-panel export-panel">
        <div>
          <p class="section-label">Exports</p>
          <h2>CSV downloads</h2>
        </div>
        <div class="export-actions">
          <a class="btn-secondary" :href="exportUrl('invoices.csv')" download>Invoices</a>
          <a class="btn-secondary" :href="exportUrl('payments.csv')" download>Payments</a>
          <a class="btn-secondary" :href="exportUrl('refunds.csv')" download>Refunds</a>
          <a class="btn-secondary" :href="exportUrl('payroll.csv')" download>Payroll</a>
        </div>
      </section>

      <div class="report-grid">
        <section class="surface-panel report-panel">
          <div class="section-heading">
            <h2>Revenue by status</h2>
            <span>{{ visibleInvoices.length }} invoices</span>
          </div>
          <div class="bar-list">
            <div v-for="row in statusBreakdown" :key="row.status" class="bar-row">
              <div>
                <strong>{{ getInvoiceStatusLabel(row.status) }}</strong>
                <span>{{ row.count }} invoices</span>
              </div>
              <div class="bar-track" aria-hidden="true">
                <span :style="{ width: barWidth(row.totalCents, maxStatusCents) }" />
              </div>
              <strong>{{ formatPrice(row.totalCents) }}</strong>
            </div>
          </div>
        </section>

        <section class="surface-panel report-panel">
          <div class="section-heading">
            <h2>Payments by method</h2>
            <span>{{ visiblePayments.length }} payments</span>
          </div>
          <div class="bar-list">
            <div v-for="row in paymentBreakdown" :key="row.method" class="bar-row">
              <div>
                <strong>{{ getPaymentMethodLabel(row.method) }}</strong>
                <span>{{ row.count }} payments</span>
              </div>
              <div class="bar-track" aria-hidden="true">
                <span :style="{ width: barWidth(row.amountCents, maxPaymentCents) }" />
              </div>
              <strong>{{ formatPrice(row.amountCents) }}</strong>
            </div>
          </div>
        </section>
      </div>

      <section class="surface-panel table-panel">
        <div class="section-heading">
          <h2>Service sales</h2>
          <span>{{ serviceRows.length }} services</span>
        </div>
        <div class="report-table service-table" role="table" aria-label="Service sales">
          <div class="report-table-head" role="row">
            <span>Service</span>
            <span>Lines</span>
            <span>Qty</span>
            <span>Sales</span>
          </div>
          <div v-for="row in serviceRows" :key="row.key" class="report-row" role="row">
            <strong>{{ row.name }}</strong>
            <span>{{ row.lineCount }}</span>
            <span>{{ row.quantity }}</span>
            <strong>{{ formatPrice(row.salesCents) }}</strong>
          </div>
        </div>
      </section>

      <section class="surface-panel table-panel">
        <div class="section-heading">
          <h2>Staff payroll</h2>
          <span>{{ payrollRows.length }} artists</span>
        </div>
        <div class="report-table payroll-table" role="table" aria-label="Staff payroll">
          <div class="report-table-head" role="row">
            <span>Staff</span>
            <span>Lines</span>
            <span>Sales</span>
            <span>Commission</span>
          </div>
          <div v-for="row in payrollRows" :key="row.key" class="report-row" role="row">
            <strong>{{ row.staffName }}</strong>
            <span>{{ row.lineCount }}</span>
            <span>{{ formatPrice(row.salesCents) }}</span>
            <strong>{{ formatPrice(row.commissionCents) }}</strong>
          </div>
        </div>
      </section>
    </template>
  </AdminShell>
</template>

<script setup lang="ts">
import { getInvoiceStatusLabel, getPaymentMethodLabel } from '../../utils/finance-format'
import { formatPrice } from '../../utils/format'
import { summarizeRevenue } from '../../utils/finance-reports'

definePageMeta({
  middleware: 'admin-auth',
  layout: false
})

interface ReportInvoice {
  id: string
  invoiceNumber: string
  source: string
  customerName: string
  status: string
  totalCents: number
  refundedCents: number
  taxCents: number
  tipCents: number
  issuedAt: string | null
  createdAt: string
}

interface ReportPayment {
  id: string
  invoiceId: string
  method: string
  amountCents: number
  paidAt: string
}

interface ReportRefund {
  id: string
  invoiceId: string
  method: string
  amountCents: number
  refundedAt: string
}

interface ReportItem {
  id: string
  invoiceId: string
  serviceId: string | null
  staffId: string | null
  staffName: string | null
  name: string
  quantity: number
  lineTotalCents: number
  commissionCents: number
}

interface RevenueReport {
  invoices: ReportInvoice[]
  payments: ReportPayment[]
  refunds: ReportRefund[]
  items: ReportItem[]
}

const config = useRuntimeConfig()
const baseUrl = config.public.apiBaseUrl
const report = ref<RevenueReport | null>(null)
const loading = ref(true)
const dateFrom = ref('')
const dateTo = ref('')
const staffFilter = ref('all')
const methodFilter = ref('all')

const allInvoices = computed(() => report.value?.invoices ?? [])
const allPayments = computed(() => report.value?.payments ?? [])
const allItems = computed(() => report.value?.items ?? [])

const staffOptions = computed(() => {
  const staffMap = new Map<string, string>()
  for (const item of allItems.value) {
    if (item.staffId) {
      staffMap.set(item.staffId, item.staffName ?? 'Unassigned')
    }
  }
  return Array.from(staffMap, ([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name))
})

const methodOptions = computed(() =>
  Array.from(new Set(allPayments.value.map((payment) => payment.method))).sort((a, b) => a.localeCompare(b))
)

const visibleInvoices = computed(() =>
  allInvoices.value.filter((invoice) => {
    if (!matchesDate(invoice) || !matchesStaff(invoice.id) || !matchesMethod(invoice.id)) {
      return false
    }
    return true
  })
)

const visibleInvoiceIds = computed(() => new Set(visibleInvoices.value.map((invoice) => invoice.id)))
const visiblePayments = computed(() =>
  allPayments.value.filter((payment) => visibleInvoiceIds.value.has(payment.invoiceId))
)
const visibleItems = computed(() => allItems.value.filter((item) => visibleInvoiceIds.value.has(item.invoiceId)))
const summary = computed(() => summarizeRevenue(visibleInvoices.value))

const statusBreakdown = computed(() => {
  const rows = new Map<string, { status: string; count: number; totalCents: number }>()
  for (const invoice of visibleInvoices.value) {
    const current = rows.get(invoice.status) ?? { status: invoice.status, count: 0, totalCents: 0 }
    current.count += 1
    current.totalCents += invoice.totalCents
    rows.set(invoice.status, current)
  }
  return Array.from(rows.values()).sort((a, b) => b.totalCents - a.totalCents)
})

const paymentBreakdown = computed(() => {
  const rows = new Map<string, { method: string; count: number; amountCents: number }>()
  for (const payment of visiblePayments.value) {
    const current = rows.get(payment.method) ?? { method: payment.method, count: 0, amountCents: 0 }
    current.count += 1
    current.amountCents += payment.amountCents
    rows.set(payment.method, current)
  }
  return Array.from(rows.values()).sort((a, b) => b.amountCents - a.amountCents)
})

const serviceRows = computed(() => {
  const rows = new Map<string, { key: string; name: string; lineCount: number; quantity: number; salesCents: number }>()
  for (const item of visibleItems.value) {
    const key = item.serviceId ?? item.name
    const current = rows.get(key) ?? { key, name: item.name, lineCount: 0, quantity: 0, salesCents: 0 }
    current.lineCount += 1
    current.quantity += item.quantity
    current.salesCents += item.lineTotalCents
    rows.set(key, current)
  }
  return Array.from(rows.values()).sort((a, b) => b.salesCents - a.salesCents)
})

const payrollRows = computed(() => {
  const rows = new Map<
    string,
    { key: string; staffName: string; lineCount: number; salesCents: number; commissionCents: number }
  >()
  for (const item of visibleItems.value) {
    const key = item.staffId ?? 'unassigned'
    const current = rows.get(key) ?? {
      key,
      staffName: item.staffName ?? 'Unassigned',
      lineCount: 0,
      salesCents: 0,
      commissionCents: 0
    }
    current.lineCount += 1
    current.salesCents += item.lineTotalCents
    current.commissionCents += item.commissionCents
    rows.set(key, current)
  }
  return Array.from(rows.values()).sort((a, b) => b.salesCents - a.salesCents)
})

const maxStatusCents = computed(() => Math.max(0, ...statusBreakdown.value.map((row) => row.totalCents)))
const maxPaymentCents = computed(() => Math.max(0, ...paymentBreakdown.value.map((row) => row.amountCents)))

function matchesDate(invoice: ReportInvoice) {
  const rawDate = invoice.issuedAt ?? invoice.createdAt
  if (!rawDate) return true
  const time = new Date(rawDate).getTime()
  if (dateFrom.value && time < new Date(`${dateFrom.value}T00:00:00`).getTime()) {
    return false
  }
  if (dateTo.value && time > new Date(`${dateTo.value}T23:59:59`).getTime()) {
    return false
  }
  return true
}

function matchesStaff(invoiceId: string) {
  if (staffFilter.value === 'all') return true
  return allItems.value.some((item) => item.invoiceId === invoiceId && item.staffId === staffFilter.value)
}

function matchesMethod(invoiceId: string) {
  if (methodFilter.value === 'all') return true
  return allPayments.value.some((payment) => payment.invoiceId === invoiceId && payment.method === methodFilter.value)
}

function barWidth(value: number, max: number) {
  if (max <= 0) return '0%'
  return `${Math.max(4, Math.round((value / max) * 100))}%`
}

function exportUrl(fileName: string) {
  return `${baseUrl}/admin/exports/${fileName}`
}

function printReport() {
  window.print()
}

try {
  report.value = await $fetch<RevenueReport>(`${baseUrl}/admin/reports/revenue`, { credentials: 'include' })
} finally {
  loading.value = false
}
</script>

<style scoped>
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

.header-action {
  white-space: nowrap;
}

.report-filters {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.75rem;
  margin-bottom: 1rem;
  padding: 1rem;
}

.field {
  display: grid;
  gap: 0.35rem;
}

.field span,
.section-label {
  color: var(--color-ink-soft);
  font-size: 0.78rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.kpi-grid {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.kpi-card {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-card);
  background: rgba(255, 251, 247, 0.88);
  padding: 0.9rem;
}

.kpi-card span {
  color: var(--color-muted);
  display: block;
  font-size: 0.78rem;
  font-weight: 800;
  margin-bottom: 0.45rem;
  text-transform: uppercase;
}

.kpi-card strong {
  color: var(--color-ink);
  font-size: clamp(1.15rem, 2vw, 1.55rem);
}

.export-panel,
.section-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.export-panel,
.report-panel,
.table-panel,
.loading-state {
  padding: 1rem;
}

.export-panel {
  margin-bottom: 1rem;
}

.export-panel h2,
.section-heading h2 {
  margin: 0;
  font-size: 1.05rem;
}

.section-label {
  margin: 0 0 0.25rem;
}

.export-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.export-actions a {
  min-height: 2.35rem;
  padding: 0.5rem 0.75rem;
  text-decoration: none;
}

.report-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
  margin-bottom: 1rem;
}

.section-heading {
  margin-bottom: 0.85rem;
}

.section-heading span {
  color: var(--color-muted);
  font-size: 0.85rem;
  font-weight: 800;
}

.bar-list {
  display: grid;
  gap: 0.75rem;
}

.bar-row {
  display: grid;
  grid-template-columns: minmax(140px, 0.8fr) minmax(160px, 1fr) minmax(86px, auto);
  gap: 0.75rem;
  align-items: center;
}

.bar-row span {
  color: var(--color-muted);
  display: block;
  font-size: 0.82rem;
}

.bar-track {
  height: 0.65rem;
  overflow: hidden;
  border-radius: 999px;
  background: rgba(116, 85, 70, 0.12);
}

.bar-track span {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: var(--color-clay);
}

.table-panel {
  margin-bottom: 1rem;
}

.report-table {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-card);
  overflow: hidden;
}

.report-table-head,
.report-row {
  display: grid;
  gap: 0.75rem;
  align-items: center;
  padding: 0.75rem 0.9rem;
}

.service-table .report-table-head,
.service-table .report-row,
.payroll-table .report-table-head,
.payroll-table .report-row {
  grid-template-columns: minmax(180px, 1fr) 100px 120px 140px;
}

.report-table-head {
  background: rgba(239, 226, 214, 0.55);
  color: var(--color-muted);
  font-size: 0.75rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.report-row {
  border-top: 1px solid var(--color-border);
}

@media (max-width: 1100px) {
  .kpi-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 900px) {
  .admin-page-header,
  .export-panel,
  .report-grid,
  .report-filters,
  .bar-row,
  .service-table .report-table-head,
  .service-table .report-row,
  .payroll-table .report-table-head,
  .payroll-table .report-row {
    display: grid;
    grid-template-columns: 1fr;
  }

  .report-table-head {
    display: none;
  }
}

@media (max-width: 640px) {
  .kpi-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media print {
  .admin-page-header,
  .report-filters,
  .export-panel {
    display: none;
  }
}
</style>
