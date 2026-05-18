<template>
  <AdminShell>
    <div class="admin-page-header">
      <div>
        <p class="eyebrow">Finance</p>
        <h1 class="display-title">Invoices</h1>
        <p>Review checkout activity, payment status, and refund history.</p>
      </div>
      <NuxtLink class="btn-primary header-link" to="/admin/pos">New invoice</NuxtLink>
    </div>

    <section class="surface-panel invoice-shell">
      <div class="filter-grid">
        <label class="field search-field">
          <span>Search</span>
          <input v-model="searchQuery" class="form-control" type="search" placeholder="Invoice or customer" />
        </label>
        <label class="field">
          <span>Status</span>
          <select v-model="statusFilter" class="form-control">
            <option value="all">All</option>
            <option value="open">Open</option>
            <option value="paid">Paid</option>
            <option value="partially_refunded">Partially refunded</option>
            <option value="refunded">Refunded</option>
            <option value="void">Void</option>
          </select>
        </label>
        <label class="field">
          <span>Source</span>
          <select v-model="sourceFilter" class="form-control">
            <option value="all">All</option>
            <option value="booking">Booking</option>
            <option value="walk_in">Walk-in</option>
          </select>
        </label>
        <label class="field rows-field">
          <span>Rows</span>
          <select v-model.number="pageSize" class="form-control">
            <option :value="5">5</option>
            <option :value="10">10</option>
            <option :value="20">20</option>
          </select>
        </label>
      </div>

      <div v-if="loading" class="loading-state">Loading invoices...</div>
      <div v-else-if="!page.items.length" class="empty-state">No invoices found.</div>

      <div v-else class="invoice-table" role="table" aria-label="Invoices">
        <div class="invoice-table-head" role="row">
          <span>Invoice</span>
          <span>Customer</span>
          <span>Source</span>
          <span>Status</span>
          <span>Total</span>
          <span />
        </div>
        <div v-for="invoice in page.items" :key="invoice.id" class="invoice-row" role="row">
          <div>
            <strong>{{ invoice.invoiceNumber }}</strong>
            <small>{{ formatDate(invoice.issuedAt || invoice.createdAt) }}</small>
          </div>
          <span>{{ invoice.customerName }}</span>
          <span>{{ invoice.source === 'walk_in' ? 'Walk-in' : 'Booking' }}</span>
          <span class="status-pill">{{ getInvoiceStatusLabel(invoice.status) }}</span>
          <strong>{{ formatPrice(invoice.totalCents) }}</strong>
          <NuxtLink class="btn-secondary table-action" :to="`/admin/invoices/${invoice.id}`">View</NuxtLink>
        </div>
      </div>

      <div class="pagination-row">
        <span>{{ page.startItem }}-{{ page.endItem }} of {{ page.totalItems }}</span>
        <div class="pagination-actions">
          <button class="btn-secondary" type="button" :disabled="page.currentPage <= 1" @click="currentPage--">
            Previous
          </button>
          <button
            class="btn-secondary"
            type="button"
            :disabled="page.currentPage >= page.totalPages"
            @click="currentPage++"
          >
            Next
          </button>
        </div>
      </div>
    </section>
  </AdminShell>
</template>

<script setup lang="ts">
import { getInvoiceStatusLabel } from '../../utils/finance-format'
import { formatPrice } from '../../utils/format'
import { filterInvoices, paginateInvoices } from '../../utils/invoice-table'

definePageMeta({
  middleware: 'admin-auth',
  layout: false
})

interface AdminInvoice {
  id: string
  invoiceNumber: string
  source: string
  customerName: string
  status: string
  totalCents: number
  issuedAt: string | null
  createdAt: string
}

const config = useRuntimeConfig()
const baseUrl = config.public.apiBaseUrl

const invoices = ref<AdminInvoice[]>([])
const loading = ref(true)
const searchQuery = ref('')
const statusFilter = ref('all')
const sourceFilter = ref('all')
const currentPage = ref(1)
const pageSize = ref(10)

const filteredInvoices = computed(() =>
  filterInvoices(invoices.value, {
    searchQuery: searchQuery.value,
    status: statusFilter.value,
    source: sourceFilter.value
  })
)
const page = computed(() => paginateInvoices(filteredInvoices.value, currentPage.value, pageSize.value))

watch([searchQuery, statusFilter, sourceFilter, pageSize], () => {
  currentPage.value = 1
})

function formatDate(value: string | null) {
  if (!value) return ''
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(value))
}

try {
  invoices.value = await $fetch<AdminInvoice[]>(`${baseUrl}/admin/invoices`, { credentials: 'include' })
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

.header-link,
.table-action {
  text-decoration: none;
}

.invoice-shell {
  padding: 1rem;
}

.filter-grid {
  display: grid;
  grid-template-columns: minmax(240px, 1fr) minmax(150px, 0.25fr) minmax(150px, 0.25fr) minmax(110px, 0.18fr);
  gap: 0.75rem;
  align-items: end;
  margin-bottom: 1rem;
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

.invoice-table {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-card);
  overflow: hidden;
}

.invoice-table-head,
.invoice-row {
  display: grid;
  grid-template-columns: minmax(150px, 1fr) minmax(160px, 1fr) 110px 150px 110px auto;
  gap: 0.75rem;
  align-items: center;
  padding: 0.8rem 1rem;
}

.invoice-table-head {
  background: rgba(239, 226, 214, 0.55);
  color: var(--color-muted);
  font-size: 0.75rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.invoice-row {
  border-top: 1px solid var(--color-border);
}

.invoice-row small {
  display: block;
  color: var(--color-muted);
  margin-top: 0.2rem;
}

.status-pill {
  display: inline-flex;
  justify-content: center;
  border-radius: 999px;
  background: rgba(56, 118, 83, 0.13);
  color: var(--color-success);
  font-size: 0.78rem;
  font-weight: 900;
  padding: 0.35rem 0.7rem;
}

.table-action {
  min-height: 2.2rem;
  padding: 0.4rem 0.65rem;
}

.pagination-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  color: var(--color-muted);
  font-size: 0.85rem;
  font-weight: 800;
  margin-top: 1rem;
}

.pagination-actions {
  display: flex;
  gap: 0.5rem;
}

.loading-state,
.empty-state {
  color: var(--color-muted);
  padding: 2rem 0.5rem;
}

@media (max-width: 900px) {
  .admin-page-header,
  .filter-grid,
  .invoice-table-head,
  .invoice-row,
  .pagination-row {
    display: grid;
    grid-template-columns: 1fr;
  }

  .invoice-table-head {
    display: none;
  }
}
</style>
