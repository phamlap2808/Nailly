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

<script setup lang="ts">
import { formatPrice } from '../../../../utils/format'

definePageMeta({
  middleware: 'admin-auth',
  layout: false
})

interface ReceiptInvoice {
  invoiceNumber: string
  customerName: string
  totalCents: number
  items: Array<{ id: string; name: string; lineTotalCents: number }>
}

const route = useRoute()
const config = useRuntimeConfig()
const invoice = ref<ReceiptInvoice | null>(null)

function print() {
  window.print()
}

onMounted(async () => {
  invoice.value = await $fetch<ReceiptInvoice>(`${config.public.apiBaseUrl}/admin/invoices/${route.params.id}`, {
    credentials: 'include'
  })
})
</script>

<style scoped>
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

.receipt-total {
  font-weight: 800;
}

.print-button {
  width: 100%;
  border: 1px solid #111;
  background: #fff;
  color: #111;
  margin-top: 12px;
  padding: 8px;
}

@media print {
  .print-button {
    display: none;
  }
}
</style>
