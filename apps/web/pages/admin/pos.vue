<template>
  <AdminShell>
    <div class="admin-page-header">
      <div>
        <p class="eyebrow">POS</p>
        <h1 class="display-title">Checkout</h1>
        <p>Create a walk-in invoice or finish a booked appointment.</p>
      </div>
      <button class="btn-primary" type="button" :disabled="!items.length || saving" @click="createInvoice">
        {{ saving ? 'Saving...' : 'Save invoice' }}
      </button>
    </div>

    <div class="pos-layout">
      <section class="surface-panel pos-services">
        <div class="section-heading">
          <h2>Services</h2>
        </div>
        <input v-model="serviceSearch" class="form-control" type="search" placeholder="Search services" />
        <div class="service-list">
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
        </div>
      </section>

      <section class="surface-panel pos-ticket">
        <div class="section-heading">
          <h2>Invoice items</h2>
        </div>

        <div v-if="!items.length" class="empty-ticket">No items added.</div>

        <div v-for="(item, index) in items" :key="index" class="ticket-row">
          <input v-model="item.name" class="form-control item-name" aria-label="Item name" />
          <select v-model="item.staffId" class="form-control" aria-label="Staff">
            <option :value="null">No staff</option>
            <option v-for="person in staff" :key="person.id" :value="person.id">{{ person.name }}</option>
          </select>
          <input v-model.number="item.quantity" class="form-control" type="number" min="1" aria-label="Quantity" />
          <input
            v-model.number="item.unitPriceCents"
            class="form-control"
            type="number"
            min="0"
            aria-label="Unit price cents"
          />
          <button class="btn-secondary remove-btn" type="button" @click="removeItem(index)">Remove</button>
        </div>

        <button class="btn-secondary add-manual-btn" type="button" @click="addManualItem">
          Add manual item
        </button>
      </section>

      <aside class="surface-panel pos-summary">
        <div class="section-heading">
          <h2>Total</h2>
        </div>
        <dl>
          <div><dt>Subtotal</dt><dd>{{ formatPrice(totals.subtotalCents) }}</dd></div>
          <div><dt>Discount</dt><dd>{{ formatPrice(totals.discountCents) }}</dd></div>
          <div><dt>Tax</dt><dd>{{ formatPrice(totals.taxCents) }}</dd></div>
          <div><dt>Tip</dt><dd>{{ formatPrice(totals.tipCents) }}</dd></div>
          <div class="total-row"><dt>Total</dt><dd>{{ formatPrice(totals.totalCents) }}</dd></div>
        </dl>
        <label class="field">
          <span>Discount cents</span>
          <input v-model.number="discountCents" class="form-control" type="number" min="0" />
        </label>
        <label class="field">
          <span>Tip cents</span>
          <input v-model.number="tipCents" class="form-control" type="number" min="0" />
        </label>
        <p class="save-status" aria-live="polite">{{ saveMessage }}</p>
      </aside>
    </div>
  </AdminShell>
</template>

<script setup lang="ts">
import { calculateDraftInvoiceTotals } from '../../utils/finance-calculator'
import { formatPrice } from '../../utils/format'

definePageMeta({
  middleware: 'admin-auth',
  layout: false
})

const config = useRuntimeConfig()
const baseUrl = config.public.apiBaseUrl
const route = useRoute()

const services = ref<Array<{ id: string; name: string; priceCents: number }>>([])
const staff = ref<Array<{ id: string; name: string }>>([])
const serviceSearch = ref('')
const discountCents = ref(0)
const tipCents = ref(0)
const taxRateBps = ref(825)
const saving = ref(false)
const saveMessage = ref('')
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

const bookingId = computed(() => {
  const value = route.query.bookingId
  return typeof value === 'string' && value ? value : null
})

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

function removeItem(index: number) {
  items.value.splice(index, 1)
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
  if (!items.value.length) return

  saving.value = true
  saveMessage.value = ''
  try {
    await $fetch(`${baseUrl}/admin/invoices`, {
      method: 'POST',
      credentials: 'include',
      body: {
        source: bookingId.value ? 'booking' : 'walk_in',
        bookingId: bookingId.value,
        customerName: bookingId.value ? 'Booked customer' : 'Walk-in customer',
        items: items.value,
        discountCents: discountCents.value,
        tipCents: tipCents.value
      }
    })
    items.value = []
    discountCents.value = 0
    tipCents.value = 0
    saveMessage.value = 'Invoice saved.'
  } finally {
    saving.value = false
  }
}

onMounted(loadData)
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

.pos-layout {
  display: grid;
  grid-template-columns: minmax(220px, 0.8fr) minmax(360px, 1.35fr) minmax(260px, 0.85fr);
  gap: 1rem;
  align-items: start;
}

.pos-services,
.pos-ticket,
.pos-summary {
  padding: 1rem;
}

.section-heading h2 {
  margin: 0 0 0.8rem;
  font-size: 1.05rem;
}

.service-list {
  display: grid;
  gap: 0.5rem;
  margin-top: 0.75rem;
}

.service-pick-row {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-card);
  background: var(--color-surface-strong);
  color: var(--color-ink);
  padding: 0.7rem 0.8rem;
  text-align: left;
}

.service-pick-row span {
  font-weight: 800;
}

.service-pick-row strong {
  color: var(--color-primary);
}

.ticket-row {
  display: grid;
  grid-template-columns: minmax(160px, 1.4fr) minmax(130px, 1fr) 80px 110px auto;
  gap: 0.5rem;
  align-items: center;
  border-bottom: 1px solid var(--color-border);
  padding: 0.65rem 0;
}

.item-name {
  font-weight: 800;
}

.remove-btn {
  min-height: 2.35rem;
  padding: 0.35rem 0.65rem;
}

.add-manual-btn {
  margin-top: 0.9rem;
}

.empty-ticket {
  border: 1px dashed var(--color-border);
  border-radius: var(--radius-card);
  color: var(--color-muted);
  padding: 1rem;
}

.pos-summary {
  position: sticky;
  top: 1rem;
}

.pos-summary dl {
  display: grid;
  gap: 0.55rem;
  margin: 0 0 1rem;
}

.pos-summary dl div {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
}

.pos-summary dt {
  color: var(--color-muted);
  font-weight: 700;
}

.pos-summary dd {
  margin: 0;
  font-weight: 900;
}

.total-row {
  border-top: 1px solid var(--color-border);
  padding-top: 0.7rem;
}

.field {
  display: grid;
  gap: 0.35rem;
  margin-top: 0.75rem;
}

.field span {
  color: var(--color-ink-soft);
  font-size: 0.85rem;
  font-weight: 700;
}

.save-status {
  min-height: 1.4rem;
  color: var(--color-success);
  font-size: 0.85rem;
  font-weight: 800;
  margin: 0.75rem 0 0;
}

@media (max-width: 900px) {
  .admin-page-header,
  .pos-layout,
  .ticket-row {
    display: grid;
    grid-template-columns: 1fr;
  }

  .pos-summary {
    position: static;
  }
}
</style>
