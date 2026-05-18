<template>
  <AdminShell>
    <div class="admin-page-header">
      <div>
        <p class="eyebrow">Invoice</p>
        <h1 class="display-title">{{ invoice?.invoiceNumber ?? 'Invoice' }}</h1>
        <p v-if="invoice">{{ invoice.customerName }} · {{ getInvoiceStatusLabel(invoice.status) }}</p>
      </div>
      <div v-if="invoice" class="header-actions">
        <NuxtLink class="btn-secondary" :to="`/admin/invoices/${invoice.id}/receipt`">Print receipt</NuxtLink>
        <NuxtLink class="btn-secondary" :to="`/admin/invoices/${invoice.id}/print`">Print A4</NuxtLink>
      </div>
    </div>

    <div v-if="loading" class="loading-state surface-panel">Loading invoice...</div>
    <div v-else-if="!invoice" class="empty-state surface-panel">Invoice not found.</div>

    <div v-else class="invoice-detail-layout">
      <section class="surface-panel detail-panel">
        <div class="section-heading">
          <h2>Line items</h2>
        </div>
        <div class="line-table">
          <div class="line-table-head">
            <span>Item</span>
            <span>Staff</span>
            <span>Qty</span>
            <span>Price</span>
            <span>Total</span>
          </div>
          <div v-for="item in invoice.items" :key="item.id" class="line-row">
            <div>
              <strong>{{ item.name }}</strong>
              <small v-if="item.description">{{ item.description }}</small>
            </div>
            <span>{{ item.staffId ? 'Assigned' : 'No staff' }}</span>
            <span>{{ item.quantity }}</span>
            <span>{{ formatPrice(item.unitPriceCents) }}</span>
            <strong>{{ formatPrice(item.lineTotalCents) }}</strong>
          </div>
        </div>
      </section>

      <aside class="surface-panel total-panel">
        <div class="section-heading">
          <h2>Totals</h2>
        </div>
        <dl>
          <div><dt>Subtotal</dt><dd>{{ formatPrice(invoice.subtotalCents) }}</dd></div>
          <div><dt>Discount</dt><dd>{{ formatPrice(invoice.discountCents) }}</dd></div>
          <div><dt>Tax</dt><dd>{{ formatPrice(invoice.taxCents) }}</dd></div>
          <div><dt>Tip</dt><dd>{{ formatPrice(invoice.tipCents) }}</dd></div>
          <div class="grand-total"><dt>Total</dt><dd>{{ formatPrice(invoice.totalCents) }}</dd></div>
          <div><dt>Paid</dt><dd>{{ formatPrice(invoice.paidCents) }}</dd></div>
          <div><dt>Refunded</dt><dd>{{ formatPrice(invoice.refundedCents) }}</dd></div>
        </dl>
        <div class="invoice-actions">
          <button class="btn-secondary" type="button" @click="showRefundForm = !showRefundForm">Refund</button>
          <button
            v-if="invoice.paidCents === 0"
            class="btn-secondary"
            type="button"
            @click="showVoidForm = !showVoidForm"
          >
            Void
          </button>
        </div>

        <form v-if="showRefundForm" class="action-form" @submit.prevent="addRefund">
          <label class="field">
            <span>Refund method</span>
            <select v-model="refundForm.method" class="form-control">
              <option value="cash">Cash</option>
              <option value="credit_card">Credit card</option>
              <option value="debit_card">Debit card</option>
              <option value="zelle">Zelle</option>
              <option value="venmo">Venmo</option>
              <option value="gift_card">Gift card</option>
              <option value="other">Other</option>
            </select>
          </label>
          <label class="field">
            <span>Amount cents</span>
            <input v-model.number="refundForm.amountCents" class="form-control" type="number" min="1" />
          </label>
          <label class="field">
            <span>Reason</span>
            <textarea v-model="refundForm.reason" class="form-control" rows="3" required />
          </label>
          <button class="btn-primary" type="submit" :disabled="savingRefund">
            {{ savingRefund ? 'Refunding...' : 'Submit refund' }}
          </button>
        </form>

        <form v-if="showVoidForm && invoice.paidCents === 0" class="action-form" @submit.prevent="voidInvoice">
          <label class="field">
            <span>Void reason</span>
            <textarea v-model="voidReason" class="form-control" rows="3" required />
          </label>
          <button class="btn-primary" type="submit" :disabled="savingVoid">
            {{ savingVoid ? 'Voiding...' : 'Void invoice' }}
          </button>
        </form>
      </aside>

      <section class="surface-panel detail-panel">
        <div class="section-heading">
          <h2>Payments</h2>
        </div>
        <div v-if="!invoice.payments.length" class="empty-inline">No payments yet.</div>
        <div v-for="payment in invoice.payments" :key="payment.id" class="history-row">
          <span>{{ getPaymentMethodLabel(payment.method) }}</span>
          <strong>{{ formatPrice(payment.amountCents) }}</strong>
        </div>

        <form class="payment-form" @submit.prevent="addPayment">
          <label class="field">
            <span>Method</span>
            <select v-model="paymentForm.method" class="form-control">
              <option value="cash">Cash</option>
              <option value="credit_card">Credit card</option>
              <option value="debit_card">Debit card</option>
              <option value="zelle">Zelle</option>
              <option value="venmo">Venmo</option>
              <option value="gift_card">Gift card</option>
              <option value="other">Other</option>
            </select>
          </label>
          <label class="field">
            <span>Amount cents</span>
            <input v-model.number="paymentForm.amountCents" class="form-control" type="number" min="1" />
          </label>
          <label class="field">
            <span>Reference</span>
            <input v-model="paymentForm.reference" class="form-control" />
          </label>
          <label class="field">
            <span>Note</span>
            <input v-model="paymentForm.note" class="form-control" />
          </label>
          <button class="btn-primary" type="submit" :disabled="savingPayment">
            {{ savingPayment ? 'Adding...' : 'Add payment' }}
          </button>
        </form>
      </section>

      <section class="surface-panel detail-panel">
        <div class="section-heading">
          <h2>Refunds</h2>
        </div>
        <div v-if="!invoice.refunds.length" class="empty-inline">No refunds yet.</div>
        <div v-for="refund in invoice.refunds" :key="refund.id" class="history-row">
          <span>{{ getPaymentMethodLabel(refund.method) }}</span>
          <strong>{{ formatPrice(refund.amountCents) }}</strong>
        </div>
      </section>
    </div>
  </AdminShell>
</template>

<script setup lang="ts">
import { getInvoiceStatusLabel, getPaymentMethodLabel } from '../../../utils/finance-format'
import { formatPrice } from '../../../utils/format'

definePageMeta({
  middleware: 'admin-auth',
  layout: false
})

interface InvoiceItem {
  id: string
  name: string
  description: string | null
  staffId: string | null
  quantity: number
  unitPriceCents: number
  lineTotalCents: number
}

interface InvoiceHistoryRow {
  id: string
  method: string
  amountCents: number
}

interface AdminInvoiceDetail {
  id: string
  invoiceNumber: string
  customerName: string
  status: string
  subtotalCents: number
  discountCents: number
  taxCents: number
  tipCents: number
  totalCents: number
  paidCents: number
  refundedCents: number
  items: InvoiceItem[]
  payments: InvoiceHistoryRow[]
  refunds: InvoiceHistoryRow[]
}

const config = useRuntimeConfig()
const baseUrl = config.public.apiBaseUrl
const route = useRoute()
const invoiceId = computed(() => String(route.params.id))

const invoice = ref<AdminInvoiceDetail | null>(null)
const loading = ref(true)
const savingPayment = ref(false)
const savingRefund = ref(false)
const savingVoid = ref(false)
const showRefundForm = ref(false)
const showVoidForm = ref(false)
const paymentForm = reactive({
  method: 'cash',
  amountCents: 0,
  reference: '',
  note: ''
})
const refundForm = reactive({
  method: 'cash',
  amountCents: 0,
  reason: ''
})
const voidReason = ref('')

async function fetchInvoice() {
  loading.value = true
  try {
    invoice.value = await $fetch<AdminInvoiceDetail>(`${baseUrl}/admin/invoices/${invoiceId.value}`, {
      credentials: 'include'
    })
  } finally {
    loading.value = false
  }
}

async function addPayment() {
  savingPayment.value = true
  try {
    await $fetch(`${baseUrl}/admin/invoices/${invoiceId.value}/payments`, {
      method: 'POST',
      credentials: 'include',
      body: {
        method: paymentForm.method,
        amountCents: paymentForm.amountCents,
        reference: paymentForm.reference || '',
        note: paymentForm.note || ''
      }
    })
    paymentForm.amountCents = 0
    paymentForm.reference = ''
    paymentForm.note = ''
    await fetchInvoice()
  } finally {
    savingPayment.value = false
  }
}

async function addRefund() {
  savingRefund.value = true
  try {
    await $fetch(`${baseUrl}/admin/invoices/${invoiceId.value}/refunds`, {
      method: 'POST',
      credentials: 'include',
      body: {
        method: refundForm.method,
        amountCents: refundForm.amountCents,
        reason: refundForm.reason
      }
    })
    refundForm.amountCents = 0
    refundForm.reason = ''
    showRefundForm.value = false
    await fetchInvoice()
  } finally {
    savingRefund.value = false
  }
}

async function voidInvoice() {
  savingVoid.value = true
  try {
    await $fetch(`${baseUrl}/admin/invoices/${invoiceId.value}/void`, {
      method: 'POST',
      credentials: 'include',
      body: { reason: voidReason.value }
    })
    voidReason.value = ''
    showVoidForm.value = false
    await fetchInvoice()
  } finally {
    savingVoid.value = false
  }
}

await fetchInvoice()
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

.header-actions,
.invoice-actions {
  display: flex;
  gap: 0.6rem;
  flex-wrap: wrap;
}

.header-actions a {
  text-decoration: none;
}

.invoice-detail-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(260px, 0.38fr);
  gap: 1rem;
  align-items: start;
}

.detail-panel,
.total-panel {
  padding: 1rem;
}

.total-panel {
  position: sticky;
  top: 1rem;
}

.section-heading h2 {
  margin: 0 0 0.9rem;
  font-size: 1.05rem;
}

.line-table {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-card);
  overflow: hidden;
}

.line-table-head,
.line-row {
  display: grid;
  grid-template-columns: minmax(180px, 1fr) 120px 70px 100px 100px;
  gap: 0.75rem;
  align-items: center;
  padding: 0.75rem 0.9rem;
}

.line-table-head {
  background: rgba(239, 226, 214, 0.55);
  color: var(--color-muted);
  font-size: 0.75rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.line-row {
  border-top: 1px solid var(--color-border);
}

.line-row small {
  display: block;
  color: var(--color-muted);
}

.total-panel dl {
  display: grid;
  gap: 0.55rem;
  margin: 0 0 1rem;
}

.total-panel dl div,
.history-row {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
}

.total-panel dt {
  color: var(--color-muted);
  font-weight: 700;
}

.total-panel dd {
  margin: 0;
  font-weight: 900;
}

.grand-total {
  border-top: 1px solid var(--color-border);
  padding-top: 0.7rem;
}

.history-row {
  border-top: 1px solid var(--color-border);
  padding: 0.7rem 0;
}

.payment-form {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr)) auto;
  gap: 0.65rem;
  align-items: end;
  border-top: 1px solid var(--color-border);
  margin-top: 0.9rem;
  padding-top: 0.9rem;
}

.action-form {
  display: grid;
  gap: 0.75rem;
  border-top: 1px solid var(--color-border);
  margin-top: 0.9rem;
  padding-top: 0.9rem;
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

.loading-state,
.empty-state,
.empty-inline {
  color: var(--color-muted);
  padding: 1rem;
}

@media (max-width: 900px) {
  .admin-page-header,
  .invoice-detail-layout,
  .line-table-head,
  .line-row,
  .payment-form {
    display: grid;
    grid-template-columns: 1fr;
  }

  .line-table-head {
    display: none;
  }

  .total-panel {
    position: static;
  }
}
</style>
