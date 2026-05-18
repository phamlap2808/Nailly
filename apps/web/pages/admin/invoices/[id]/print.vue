<template>
  <main class="print-page">
    <section class="invoice-document">
      <header class="document-header">
        <div>
          <h1>Luma Nail Studio</h1>
          <p>128 Main Street, Suite 4, San Jose, CA</p>
        </div>
        <button class="print-button" type="button" @click="print">Print</button>
      </header>

      <section class="document-meta">
        <div>
          <span>Invoice</span>
          <strong>{{ invoice?.invoiceNumber }}</strong>
        </div>
        <div>
          <span>Customer</span>
          <strong>{{ invoice?.customerName }}</strong>
        </div>
        <div>
          <span>Status</span>
          <strong>{{ invoice ? getInvoiceStatusLabel(invoice.status) : '' }}</strong>
        </div>
      </section>

      <table>
        <thead>
          <tr>
            <th>Item</th>
            <th>Qty</th>
            <th>Price</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in invoice?.items ?? []" :key="item.id">
            <td>{{ item.name }}</td>
            <td>{{ item.quantity }}</td>
            <td>{{ formatPrice(item.unitPriceCents) }}</td>
            <td>{{ formatPrice(item.lineTotalCents) }}</td>
          </tr>
        </tbody>
      </table>

      <section class="document-bottom">
        <div class="history">
          <h2>Payments</h2>
          <p v-if="!invoice?.payments.length">No payments recorded.</p>
          <div v-for="payment in invoice?.payments ?? []" :key="payment.id">
            <span>{{ getPaymentMethodLabel(payment.method) }}</span>
            <strong>{{ formatPrice(payment.amountCents) }}</strong>
          </div>

          <h2>Refunds</h2>
          <p v-if="!invoice?.refunds.length">No refunds recorded.</p>
          <div v-for="refund in invoice?.refunds ?? []" :key="refund.id">
            <span>{{ getPaymentMethodLabel(refund.method) }}</span>
            <strong>{{ formatPrice(refund.amountCents) }}</strong>
          </div>
        </div>

        <dl class="totals">
          <div><dt>Subtotal</dt><dd>{{ formatPrice(invoice?.subtotalCents ?? 0) }}</dd></div>
          <div><dt>Discount</dt><dd>{{ formatPrice(invoice?.discountCents ?? 0) }}</dd></div>
          <div><dt>Tax</dt><dd>{{ formatPrice(invoice?.taxCents ?? 0) }}</dd></div>
          <div><dt>Tip</dt><dd>{{ formatPrice(invoice?.tipCents ?? 0) }}</dd></div>
          <div class="grand-total"><dt>Total</dt><dd>{{ formatPrice(invoice?.totalCents ?? 0) }}</dd></div>
        </dl>
      </section>
    </section>
  </main>
</template>

<script setup lang="ts">
import { getInvoiceStatusLabel, getPaymentMethodLabel } from '../../../../utils/finance-format'
import { formatPrice } from '../../../../utils/format'

definePageMeta({
  middleware: 'admin-auth',
  layout: false
})

interface PrintInvoice {
  invoiceNumber: string
  customerName: string
  status: string
  subtotalCents: number
  discountCents: number
  taxCents: number
  tipCents: number
  totalCents: number
  items: Array<{ id: string; name: string; quantity: number; unitPriceCents: number; lineTotalCents: number }>
  payments: Array<{ id: string; method: string; amountCents: number }>
  refunds: Array<{ id: string; method: string; amountCents: number }>
}

const route = useRoute()
const config = useRuntimeConfig()
const invoice = ref<PrintInvoice | null>(null)

function print() {
  window.print()
}

onMounted(async () => {
  invoice.value = await $fetch<PrintInvoice>(`${config.public.apiBaseUrl}/admin/invoices/${route.params.id}`, {
    credentials: 'include'
  })
})
</script>

<style scoped>
.print-page {
  min-height: 100vh;
  background: #f2f2f2;
  color: #111;
  padding: 24px;
}

.invoice-document {
  width: min(100%, 210mm);
  min-height: 297mm;
  margin: 0 auto;
  background: #fff;
  padding: 22mm;
}

.document-header,
.document-meta,
.document-bottom,
.history div,
.totals div {
  display: flex;
  justify-content: space-between;
  gap: 24px;
}

.document-header {
  align-items: flex-start;
  border-bottom: 2px solid #111;
  padding-bottom: 18px;
}

.document-header h1 {
  margin: 0;
  font-size: 28px;
}

.document-meta {
  margin: 24px 0;
}

.document-meta span {
  display: block;
  color: #555;
  font-size: 12px;
  font-weight: 800;
  text-transform: uppercase;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th,
td {
  border-bottom: 1px solid #ddd;
  padding: 10px 0;
  text-align: left;
}

th:last-child,
td:last-child {
  text-align: right;
}

.document-bottom {
  align-items: flex-start;
  margin-top: 28px;
}

.history {
  width: 52%;
}

.history h2 {
  font-size: 15px;
  margin: 0.5rem 0;
}

.history p {
  color: #666;
}

.totals {
  width: 36%;
  display: grid;
  gap: 8px;
}

.totals dt {
  color: #555;
}

.totals dd {
  margin: 0;
  font-weight: 800;
}

.grand-total {
  border-top: 2px solid #111;
  padding-top: 10px;
}

.print-button {
  border: 1px solid #111;
  background: #111;
  color: #fff;
  padding: 10px 14px;
}

@media print {
  .print-page {
    background: #fff;
    padding: 0;
  }

  .invoice-document {
    width: auto;
    min-height: auto;
    padding: 0;
  }

  .print-button {
    display: none;
  }
}
</style>
