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
      <UTabs
        v-model="activeReportTab"
        :items="reportTabs"
        :content="false"
        class="report-tabs"
        color="neutral"
        variant="pill"
      />

      <section v-show="activeReportTab === 'overview'" class="report-tab-panel">
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

        <div class="overview-grid">
          <section class="surface-panel chart-panel trend-panel">
            <div class="section-heading">
              <div>
                <p class="section-label">Overview</p>
                <h2>Revenue trend</h2>
              </div>
              <span>{{ revenueTrendRows.length }} days</span>
            </div>
            <div v-if="revenueTrendRows.length" class="chart-canvas-frame">
              <canvas ref="revenueTrendCanvas" aria-label="Revenue trend chart" role="img"></canvas>
            </div>
            <p v-else class="empty-copy">No revenue in this filter.</p>
          </section>

          <section class="surface-panel chart-panel payment-mix-panel">
            <div class="section-heading">
              <div>
                <p class="section-label">Overview</p>
                <h2>Payment mix</h2>
              </div>
              <span>{{ visiblePayments.length }} payments</span>
            </div>
            <div v-if="paymentBreakdown.length" class="donut-layout">
              <div class="chart-canvas-frame doughnut-frame">
                <canvas ref="paymentMixCanvas" aria-label="Payment mix chart" role="img"></canvas>
              </div>
              <div class="legend-list">
                <div v-for="(row, index) in paymentBreakdown" :key="row.method" class="legend-row">
                  <span class="legend-dot" :style="{ '--legend-color': chartColor(index) }"></span>
                  <strong>{{ getPaymentMethodLabel(row.method) }}</strong>
                  <span>{{ formatPrice(row.amountCents) }}</span>
                </div>
              </div>
            </div>
            <p v-else class="empty-copy">No payments in this filter.</p>
          </section>

          <section class="surface-panel chart-panel">
            <div class="section-heading">
              <div>
                <p class="section-label">Leaders</p>
                <h2>Top services</h2>
              </div>
              <span>{{ serviceRows.length }} services</span>
            </div>
            <div v-if="topServiceRows.length" class="bar-list">
              <div v-for="row in topServiceRows" :key="row.key" class="bar-row compact">
                <div>
                  <strong>{{ row.name }}</strong>
                  <span>{{ row.quantity }} sold</span>
                </div>
                <div class="bar-track" aria-hidden="true">
                  <span :style="{ width: barWidth(row.salesCents, maxServiceCents) }" />
                </div>
                <strong>{{ formatPrice(row.salesCents) }}</strong>
              </div>
            </div>
            <p v-else class="empty-copy">No service sales in this filter.</p>
          </section>

          <section class="surface-panel chart-panel">
            <div class="section-heading">
              <div>
                <p class="section-label">Leaders</p>
                <h2>Top staff</h2>
              </div>
              <span>{{ payrollRows.length }} artists</span>
            </div>
            <div v-if="topPayrollRows.length" class="bar-list">
              <div v-for="row in topPayrollRows" :key="row.key" class="bar-row compact">
                <div>
                  <strong>{{ row.staffName }}</strong>
                  <span>{{ row.lineCount }} lines</span>
                </div>
                <div class="bar-track" aria-hidden="true">
                  <span :style="{ width: barWidth(row.salesCents, maxPayrollCents) }" />
                </div>
                <strong>{{ formatPrice(row.salesCents) }}</strong>
              </div>
            </div>
            <p v-else class="empty-copy">No staff sales in this filter.</p>
          </section>
        </div>
      </section>

      <section v-show="activeReportTab === 'revenue'" class="report-tab-panel">
        <div class="report-grid">
          <section class="surface-panel report-panel">
            <div class="section-heading">
              <div>
                <p class="section-label">Revenue</p>
                <h2>Revenue by status</h2>
              </div>
              <span>{{ visibleInvoices.length }} invoices</span>
            </div>
            <div v-if="statusBreakdown.length" class="bar-list">
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
            <p v-else class="empty-copy">No invoices in this filter.</p>
          </section>

          <section class="surface-panel report-panel">
            <div class="section-heading">
              <div>
                <p class="section-label">Revenue</p>
                <h2>Revenue trend</h2>
              </div>
              <span>{{ revenueTrendRows.length }} days</span>
            </div>
            <div v-if="revenueTrendRows.length" class="trend-list">
              <div v-for="row in revenueTrendRows" :key="row.key" class="bar-row">
                <div>
                  <strong>{{ row.label }}</strong>
                  <span>{{ row.invoiceCount }} invoices</span>
                </div>
                <div class="bar-track" aria-hidden="true">
                  <span :style="{ width: barWidth(row.netCents, maxTrendCents) }" />
                </div>
                <strong>{{ formatPrice(row.netCents) }}</strong>
              </div>
            </div>
            <p v-else class="empty-copy">No revenue in this filter.</p>
          </section>
        </div>
      </section>

      <section v-show="activeReportTab === 'payments'" class="report-tab-panel">
        <div class="report-grid">
          <section class="surface-panel report-panel">
            <div class="section-heading">
              <div>
                <p class="section-label">Payments</p>
                <h2>Payments by method</h2>
              </div>
              <span>{{ visiblePayments.length }} payments</span>
            </div>
            <div v-if="paymentBreakdown.length" class="bar-list">
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
            <p v-else class="empty-copy">No payments in this filter.</p>
          </section>

          <section class="surface-panel report-panel">
            <div class="section-heading">
              <div>
                <p class="section-label">Payments</p>
                <h2>Refunds</h2>
              </div>
              <span>{{ visibleRefunds.length }} refunds</span>
            </div>
            <div v-if="visibleRefunds.length" class="refund-list">
              <div v-for="refund in visibleRefunds" :key="refund.id" class="refund-row">
                <div>
                  <strong>{{ getPaymentMethodLabel(refund.method) }}</strong>
                  <span>{{ formatReportDate(refund.refundedAt) }}</span>
                </div>
                <strong>{{ formatPrice(refund.amountCents) }}</strong>
              </div>
            </div>
            <p v-else class="empty-copy">No refunds in this filter.</p>
          </section>
        </div>
      </section>

      <section v-show="activeReportTab === 'services'" class="report-tab-panel">
        <section class="surface-panel table-panel">
          <div class="section-heading">
            <div>
              <p class="section-label">Catalog</p>
              <h2>Service sales</h2>
            </div>
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
      </section>

      <section v-show="activeReportTab === 'staff'" class="report-tab-panel">
        <section class="surface-panel table-panel">
          <div class="section-heading">
            <div>
              <p class="section-label">People</p>
              <h2>Staff payroll</h2>
            </div>
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
      </section>

      <section v-show="activeReportTab === 'exports'" class="report-tab-panel">
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
      </section>

      <article class="print-report" aria-label="Printable finance report">
        <header class="print-report-header">
          <div>
            <p class="print-brand">Luma Nail Studio</p>
            <h1>Finance report</h1>
          </div>
          <div class="print-meta">
            <span>{{ printRangeLabel }}</span>
            <span>Printed {{ printedAtLabel || 'Preparing print date' }}</span>
          </div>
        </header>

        <section class="print-kpi-grid" aria-label="Printable revenue summary">
          <article class="print-kpi-card">
            <span>Gross</span>
            <strong>{{ formatPrice(summary.grossCents) }}</strong>
          </article>
          <article class="print-kpi-card">
            <span>Refunds</span>
            <strong>{{ formatPrice(summary.refundedCents) }}</strong>
          </article>
          <article class="print-kpi-card">
            <span>Net</span>
            <strong>{{ formatPrice(summary.netCents) }}</strong>
          </article>
          <article class="print-kpi-card">
            <span>Tax</span>
            <strong>{{ formatPrice(summary.taxCents) }}</strong>
          </article>
          <article class="print-kpi-card">
            <span>Tips</span>
            <strong>{{ formatPrice(summary.tipCents) }}</strong>
          </article>
          <article class="print-kpi-card">
            <span>Invoices</span>
            <strong>{{ summary.invoiceCount }}</strong>
          </article>
        </section>

        <section class="print-section">
          <h2>Revenue</h2>
          <div class="print-two-column">
            <div class="print-card">
              <h3>Revenue by status</h3>
              <table v-if="statusBreakdown.length" class="print-table">
                <thead>
                  <tr>
                    <th>Status</th>
                    <th>Invoices</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="row in statusBreakdown" :key="row.status">
                    <td>{{ getInvoiceStatusLabel(row.status) }}</td>
                    <td>{{ row.count }}</td>
                    <td>{{ formatPrice(row.totalCents) }}</td>
                  </tr>
                </tbody>
              </table>
              <p v-else class="print-empty">No invoices in this filter.</p>
            </div>

            <div class="print-card">
              <h3>Revenue trend</h3>
              <table v-if="revenueTrendRows.length" class="print-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Invoices</th>
                    <th>Net</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="row in revenueTrendRows" :key="row.key">
                    <td>{{ row.label }}</td>
                    <td>{{ row.invoiceCount }}</td>
                    <td>{{ formatPrice(row.netCents) }}</td>
                  </tr>
                </tbody>
              </table>
              <p v-else class="print-empty">No revenue in this filter.</p>
            </div>
          </div>
        </section>

        <section class="print-section">
          <h2>Payments and refunds</h2>
          <div class="print-two-column">
            <div class="print-card">
              <h3>Payments by method</h3>
              <table v-if="paymentBreakdown.length" class="print-table">
                <thead>
                  <tr>
                    <th>Method</th>
                    <th>Payments</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="row in paymentBreakdown" :key="row.method">
                    <td>{{ getPaymentMethodLabel(row.method) }}</td>
                    <td>{{ row.count }}</td>
                    <td>{{ formatPrice(row.amountCents) }}</td>
                  </tr>
                </tbody>
              </table>
              <p v-else class="print-empty">No payments in this filter.</p>
            </div>

            <div class="print-card">
              <h3>Refunds</h3>
              <table v-if="visibleRefunds.length" class="print-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Method</th>
                    <th>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="refund in visibleRefunds" :key="refund.id">
                    <td>{{ formatReportDate(refund.refundedAt) }}</td>
                    <td>{{ getPaymentMethodLabel(refund.method) }}</td>
                    <td>{{ formatPrice(refund.amountCents) }}</td>
                  </tr>
                </tbody>
              </table>
              <p v-else class="print-empty">No refunds in this filter.</p>
            </div>
          </div>
        </section>

        <section class="print-section">
          <h2>Service sales</h2>
          <table v-if="serviceRows.length" class="print-table">
            <thead>
              <tr>
                <th>Service</th>
                <th>Lines</th>
                <th>Qty</th>
                <th>Sales</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in serviceRows" :key="row.key">
                <td>{{ row.name }}</td>
                <td>{{ row.lineCount }}</td>
                <td>{{ row.quantity }}</td>
                <td>{{ formatPrice(row.salesCents) }}</td>
              </tr>
            </tbody>
          </table>
          <p v-else class="print-empty">No service sales in this filter.</p>
        </section>

        <section class="print-section">
          <h2>Staff payroll</h2>
          <table v-if="payrollRows.length" class="print-table">
            <thead>
              <tr>
                <th>Staff</th>
                <th>Lines</th>
                <th>Sales</th>
                <th>Commission</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in payrollRows" :key="row.key">
                <td>{{ row.staffName }}</td>
                <td>{{ row.lineCount }}</td>
                <td>{{ formatPrice(row.salesCents) }}</td>
                <td>{{ formatPrice(row.commissionCents) }}</td>
              </tr>
            </tbody>
          </table>
          <p v-else class="print-empty">No staff sales in this filter.</p>
        </section>
      </article>
    </template>
  </AdminShell>
</template>

<script setup lang="ts">
import Chart from 'chart.js/auto'
import type { TabsItem } from '@nuxt/ui'
import { getInvoiceStatusLabel, getPaymentMethodLabel } from '../../utils/finance-format'
import { formatPrice } from '../../utils/format'
import { summarizeRevenue } from '../../utils/finance-reports'
import { buildRevenueTrendRows, takeTopRows, toPercent } from '../../utils/report-charts'
import { buildApiUrl, resolveRuntimeApiBaseUrl } from '../../utils/api-url'

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
const requestBaseUrl = resolveRuntimeApiBaseUrl(config, import.meta.server)
const publicApiBaseUrl = config.public.apiBaseUrl ?? ''
const requestHeaders = import.meta.server ? useRequestHeaders(['cookie']) : undefined
const route = useRoute()
const router = useRouter()
const report = ref<RevenueReport | null>(null)
const loading = ref(true)
const dateFrom = ref('')
const dateTo = ref('')
const staffFilter = ref('all')
const methodFilter = ref('all')
const printedAtLabel = ref('')
const revenueTrendCanvas = ref<HTMLCanvasElement | null>(null)
const paymentMixCanvas = ref<HTMLCanvasElement | null>(null)
const revenueTrendChart = shallowRef<InstanceType<typeof Chart> | null>(null)
const paymentMixChart = shallowRef<InstanceType<typeof Chart> | null>(null)
const paymentChartColors = ['#7d4e3f', '#2f6b43', '#b8765c', '#d9a441', '#5f6f84', '#8f563f']

const reportTabs = [
  { label: 'Overview', value: 'overview' },
  { label: 'Revenue', value: 'revenue' },
  { label: 'Payments', value: 'payments' },
  { label: 'Services', value: 'services' },
  { label: 'Staff', value: 'staff' },
  { label: 'Exports', value: 'exports' }
] satisfies TabsItem[]

const reportTabValues = new Set(reportTabs.map((tab) => String(tab.value)))
const activeReportTab = computed<string | number>({
  get() {
    const rawTab = Array.isArray(route.query.tab) ? route.query.tab[0] : route.query.tab
    const tab = typeof rawTab === 'string' ? rawTab : undefined
    return tab && reportTabValues.has(tab) ? tab : 'overview'
  },
  set(tab) {
    const tabValue = String(tab)
    router.push({
      path: route.path,
      query: { ...route.query, tab: tabValue === 'overview' ? undefined : tabValue }
    })
  }
})

const allInvoices = computed(() => report.value?.invoices ?? [])
const allPayments = computed(() => report.value?.payments ?? [])
const allRefunds = computed(() => report.value?.refunds ?? [])
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
const visibleRefunds = computed(() =>
  allRefunds.value.filter((refund) => visibleInvoiceIds.value.has(refund.invoiceId))
)
const visibleItems = computed(() => allItems.value.filter((item) => visibleInvoiceIds.value.has(item.invoiceId)))
const summary = computed(() => summarizeRevenue(visibleInvoices.value))
const revenueTrendRows = computed(() => buildRevenueTrendRows(visibleInvoices.value))

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

const topServiceRows = computed(() => takeTopRows(serviceRows.value, 'salesCents', 5))
const topPayrollRows = computed(() => takeTopRows(payrollRows.value, 'salesCents', 5))
const maxTrendCents = computed(() => Math.max(0, ...revenueTrendRows.value.map((row) => row.netCents)))
const maxStatusCents = computed(() => Math.max(0, ...statusBreakdown.value.map((row) => row.totalCents)))
const maxPaymentCents = computed(() => Math.max(0, ...paymentBreakdown.value.map((row) => row.amountCents)))
const maxServiceCents = computed(() => Math.max(0, ...serviceRows.value.map((row) => row.salesCents)))
const maxPayrollCents = computed(() => Math.max(0, ...payrollRows.value.map((row) => row.salesCents)))

const printRangeLabel = computed(() => {
  const staffLabel =
    staffFilter.value === 'all'
      ? 'All staff'
      : staffOptions.value.find((staff) => staff.id === staffFilter.value)?.name ?? 'Selected staff'
  const methodLabel = methodFilter.value === 'all' ? 'All payment methods' : getPaymentMethodLabel(methodFilter.value)
  return `${formatPrintDateRange()} - ${staffLabel} - ${methodLabel}`
})

onMounted(() => {
  updatePrintedAt()
  nextTick(renderReportCharts)
})

onBeforeUnmount(() => {
  destroyReportCharts()
})

watch([revenueTrendRows, paymentBreakdown, activeReportTab], () => {
  nextTick(renderReportCharts)
})

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

function chartColor(index: number) {
  return paymentChartColors[index % paymentChartColors.length]
}

function centsToDollars(cents: number) {
  return cents / 100
}

function formatChartPrice(value: number) {
  return formatPrice(Math.round(value * 100))
}

function destroyReportCharts() {
  revenueTrendChart.value?.destroy()
  paymentMixChart.value?.destroy()
  revenueTrendChart.value = null
  paymentMixChart.value = null
}

function renderReportCharts() {
  destroyReportCharts()
  if (activeReportTab.value !== 'overview') return
  renderRevenueTrendChart()
  renderPaymentMixChart()
}

function renderRevenueTrendChart() {
  if (!revenueTrendCanvas.value || !revenueTrendRows.value.length) return

  revenueTrendChart.value = new Chart(revenueTrendCanvas.value, {
    type: 'line',
    data: {
      labels: revenueTrendRows.value.map((row) => row.label),
      datasets: [
        {
          label: 'Net revenue',
          data: revenueTrendRows.value.map((row) => centsToDollars(row.netCents)),
          borderColor: '#7d4e3f',
          backgroundColor: 'rgba(125, 78, 63, 0.14)',
          borderWidth: 2,
          fill: true,
          pointBackgroundColor: '#7d4e3f',
          pointBorderColor: '#fffaf7',
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 5,
          tension: 0.32
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label(context) {
              return `Net ${formatChartPrice(context.parsed.y)}`
            }
          }
        }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: '#74665e', maxRotation: 0 }
        },
        y: {
          beginAtZero: true,
          border: { display: false },
          grid: { color: 'rgba(116, 85, 70, 0.14)' },
          ticks: {
            color: '#74665e',
            callback(value) {
              return formatChartPrice(Number(value))
            }
          }
        }
      }
    }
  })
}

function renderPaymentMixChart() {
  if (!paymentMixCanvas.value || !paymentBreakdown.value.length) return

  paymentMixChart.value = new Chart(paymentMixCanvas.value, {
    type: 'doughnut',
    data: {
      labels: paymentBreakdown.value.map((row) => getPaymentMethodLabel(row.method)),
      datasets: [
        {
          data: paymentBreakdown.value.map((row) => centsToDollars(row.amountCents)),
          backgroundColor: paymentBreakdown.value.map((_, index) => chartColor(index)),
          borderColor: '#fffaf7',
          borderWidth: 3,
          hoverOffset: 4
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '62%',
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label(context) {
              return `${context.label}: ${formatChartPrice(Number(context.parsed))}`
            }
          }
        }
      }
    }
  })
}

function formatReportDate(value: string) {
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(value))
}

function formatFilterDate(value: string) {
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(
    new Date(`${value}T00:00:00`)
  )
}

function formatPrintDateRange() {
  if (dateFrom.value && dateTo.value) {
    return `${formatFilterDate(dateFrom.value)} - ${formatFilterDate(dateTo.value)}`
  }
  if (dateFrom.value) {
    return `From ${formatFilterDate(dateFrom.value)}`
  }
  if (dateTo.value) {
    return `Through ${formatFilterDate(dateTo.value)}`
  }
  return 'All dates'
}

function updatePrintedAt() {
  printedAtLabel.value = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  }).format(new Date())
}

function barWidth(value: number, max: number) {
  return toPercent(value, max, 4)
}

function exportUrl(fileName: string) {
  return buildApiUrl(publicApiBaseUrl, `/admin/exports/${fileName}`)
}

function printReport() {
  updatePrintedAt()
  requestAnimationFrame(() => window.print())
}

try {
  report.value = await $fetch<RevenueReport>(buildApiUrl(requestBaseUrl, '/admin/reports/revenue'), {
    credentials: 'include',
    headers: requestHeaders
  })
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

.report-tabs {
  margin-bottom: 1rem;
  max-width: 100%;
  overflow-x: auto;
  padding: 0.15rem 0 0.25rem;
  scrollbar-width: none;
}

.report-tabs::-webkit-scrollbar {
  display: none;
}

.report-tabs :deep([data-slot='list']) {
  display: flex;
  flex-wrap: nowrap;
  gap: 0.2rem;
  width: fit-content;
  max-width: 100%;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-card);
  background: rgba(255, 251, 247, 0.78);
  box-shadow: 0 12px 34px rgba(64, 49, 42, 0.06);
  padding: 0.25rem;
}

.report-tabs :deep([data-slot='trigger']) {
  min-height: 2.2rem;
  border: 0;
  border-radius: 6px;
  appearance: none;
  background: transparent;
  color: var(--color-ink-soft);
  box-shadow: none;
  font-weight: 800;
  outline: none;
  padding: 0.5rem 0.8rem;
  white-space: nowrap;
}

.report-tabs :deep([data-slot='trigger']:hover:not(:disabled)) {
  background: rgba(125, 78, 63, 0.08);
  color: var(--color-ink);
}

.report-tabs :deep([data-slot='trigger'][data-state='active']) {
  background: var(--color-primary);
  color: #fff;
  box-shadow: 0 8px 20px rgba(125, 78, 63, 0.16);
}

.report-tabs :deep([data-slot='trigger']:focus-visible) {
  box-shadow: 0 0 0 3px rgba(125, 78, 63, 0.18);
}

.report-tab-panel {
  display: grid;
  gap: 1rem;
}

.kpi-grid {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 0.75rem;
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

.overview-grid,
.report-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
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
.chart-panel,
.loading-state {
  padding: 1rem;
}

.export-panel h2,
.section-heading h2 {
  margin: 0;
  font-size: 1.05rem;
}

.section-label {
  margin: 0 0 0.25rem;
}

.section-heading {
  margin-bottom: 0.85rem;
}

.section-heading span {
  color: var(--color-muted);
  font-size: 0.85rem;
  font-weight: 800;
}

.chart-canvas-frame {
  position: relative;
  min-height: 14rem;
  width: 100%;
}

.chart-canvas-frame canvas {
  width: 100% !important;
  height: 100% !important;
}

.donut-layout {
  display: grid;
  grid-template-columns: minmax(9rem, 12rem) minmax(0, 1fr);
  gap: 1rem;
  align-items: center;
}

.doughnut-frame {
  width: min(100%, 12rem);
  min-height: 12rem;
}

.legend-list {
  display: grid;
  gap: 0.65rem;
}

.legend-row {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  gap: 0.55rem;
  align-items: center;
  color: var(--color-muted);
}

.legend-row strong {
  color: var(--color-ink);
}

.legend-dot {
  width: 0.65rem;
  height: 0.65rem;
  border-radius: 999px;
  background: var(--legend-color);
}

.bar-list,
.trend-list,
.refund-list {
  display: grid;
  gap: 0.75rem;
}

.bar-row {
  display: grid;
  grid-template-columns: minmax(140px, 0.8fr) minmax(160px, 1fr) minmax(86px, auto);
  gap: 0.75rem;
  align-items: center;
}

.bar-row.compact {
  grid-template-columns: minmax(130px, 0.8fr) minmax(120px, 1fr) minmax(76px, auto);
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

.refund-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  border-bottom: 1px solid var(--color-border);
  padding-bottom: 0.75rem;
}

.refund-row:last-child {
  border-bottom: 0;
  padding-bottom: 0;
}

.refund-row span,
.empty-copy {
  color: var(--color-muted);
}

.table-panel {
  overflow-x: auto;
}

.report-table {
  min-width: 720px;
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

.print-report {
  display: none;
}

@media (max-width: 1180px) {
  .kpi-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .overview-grid,
  .report-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 900px) {
  .admin-page-header,
  .export-panel,
  .report-filters,
  .bar-row,
  .bar-row.compact {
    display: grid;
    grid-template-columns: 1fr;
  }

  .donut-layout {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .kpi-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .report-tabs :deep([data-slot='list']) {
    max-width: none;
  }

  .report-tabs :deep([data-slot='trigger']) {
    flex: 0 0 auto;
  }

  .report-table {
    min-width: 620px;
  }
}

@media print {
  @page {
    size: A4 portrait;
    margin: 12mm;
  }

  :global(html.admin-root-lock),
  :global(body.admin-root-lock),
  :global(body.admin-root-lock #__nuxt) {
    height: auto !important;
    overflow: visible !important;
  }

  :global(body) {
    background: #fff !important;
    color: #211a16 !important;
  }

  :global(.admin-shell) {
    display: block !important;
    height: auto !important;
    min-height: 0 !important;
    overflow: visible !important;
    background: #fff !important;
  }

  :global(.admin-sidebar) {
    display: none !important;
  }

  :global(.admin-main) {
    display: block !important;
    height: auto !important;
    min-height: 0 !important;
    overflow: visible !important;
    padding: 0 !important;
  }

  .admin-page-header,
  .report-filters,
  .report-tabs,
  .report-tab-panel,
  .loading-state {
    display: none !important;
  }

  .print-report {
    display: block;
    color: #211a16;
    font-size: 9pt;
    line-height: 1.35;
  }

  .print-report * {
    box-shadow: none !important;
  }

  .print-report-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 16pt;
    border-bottom: 1px solid #d9c8bc;
    margin-bottom: 10pt;
    padding-bottom: 8pt;
  }

  .print-brand {
    color: #7d4e3f;
    font-size: 8pt;
    font-weight: 800;
    letter-spacing: 0.12em;
    margin: 0 0 3pt;
    text-transform: uppercase;
  }

  .print-report h1 {
    font-family: Georgia, "Times New Roman", serif;
    font-size: 22pt;
    line-height: 1;
    margin: 0;
  }

  .print-meta {
    display: grid;
    gap: 2pt;
    color: #74665e;
    font-size: 8pt;
    text-align: right;
  }

  .print-kpi-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 7pt;
    margin: 10pt 0 12pt;
  }

  .print-kpi-card,
  .print-card {
    break-inside: avoid;
    page-break-inside: avoid;
  }

  .print-kpi-card {
    border: 1px solid #dfd0c3;
    border-radius: 6pt;
    padding: 7pt;
  }

  .print-kpi-card span {
    color: #74665e;
    display: block;
    font-size: 7pt;
    font-weight: 800;
    letter-spacing: 0.08em;
    margin-bottom: 3pt;
    text-transform: uppercase;
  }

  .print-kpi-card strong {
    font-size: 13pt;
  }

  .print-section {
    margin-top: 12pt;
  }

  .print-section h2 {
    border-bottom: 1px solid #eadbd0;
    font-size: 12pt;
    margin: 0 0 7pt;
    padding-bottom: 4pt;
  }

  .print-two-column {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 9pt;
    align-items: start;
  }

  .print-card {
    border: 1px solid #dfd0c3;
    border-radius: 6pt;
    padding: 8pt;
  }

  .print-card h3 {
    font-size: 10pt;
    margin: 0 0 6pt;
  }

  .print-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 8pt;
  }

  .print-table thead {
    display: table-header-group;
  }

  .print-table tr {
    break-inside: avoid;
    page-break-inside: avoid;
  }

  .print-table th,
  .print-table td {
    border-bottom: 1px solid #eadbd0;
    padding: 4pt;
    text-align: left;
    vertical-align: top;
  }

  .print-table th {
    background: #f3ebe4;
    color: #6c5d55;
    font-size: 7pt;
    font-weight: 800;
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }

  .print-table th:not(:first-child),
  .print-table td:not(:first-child) {
    text-align: right;
  }

  .print-empty {
    color: #74665e;
    font-style: italic;
    margin: 0;
  }
}
</style>
