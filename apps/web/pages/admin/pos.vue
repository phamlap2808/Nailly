<template>
  <AdminShell>
    <div class="admin-page-header pos-header">
      <div>
        <p class="eyebrow">POS</p>
        <h1 class="display-title">Checkout</h1>
        <p>Create a walk-in invoice or finish a booked appointment.</p>
      </div>
    </div>

    <div class="pos-workspace">
      <section class="checkout-column surface-panel">
        <section class="checkout-section service-picker" aria-labelledby="services-title">
          <div class="section-heading pos-section-heading">
            <div>
              <p class="section-label">Catalog</p>
              <h2 id="services-title">Services</h2>
            </div>
            <div class="service-heading-actions">
              <span>{{ filteredServices.length }} shown</span>
              <div class="service-view-toggle" role="group" aria-label="Service view">
                <button
                  class="view-toggle-button"
                  :class="{ active: serviceViewMode === 'grid' }"
                  type="button"
                  :aria-pressed="serviceViewMode === 'grid'"
                  @click="serviceViewMode = 'grid'"
                >
                  <Icon name="lucide:grid-2x2" aria-hidden="true" />
                  <span>Grid</span>
                </button>
                <button
                  class="view-toggle-button"
                  :class="{ active: serviceViewMode === 'list' }"
                  type="button"
                  :aria-pressed="serviceViewMode === 'list'"
                  @click="serviceViewMode = 'list'"
                >
                  <Icon name="lucide:list" aria-hidden="true" />
                  <span>List</span>
                </button>
              </div>
            </div>
          </div>

          <label class="search-field">
            <span>Search</span>
            <input v-model="serviceSearch" class="form-control" type="search" placeholder="Search services" />
          </label>

          <div v-if="filteredServices.length" class="service-scroll">
            <div v-if="serviceViewMode === 'grid'" class="service-grid service-grid-view">
              <button
                v-for="service in filteredServices"
                :key="service.id"
                class="service-pick-card"
                type="button"
                @click="addService(service)"
              >
                <span class="service-name">{{ service.name }}</span>
                <span class="service-meta">
                  <strong>{{ formatPrice(service.priceCents) }}</strong>
                  <span>Add</span>
                </span>
              </button>
            </div>

            <div v-else class="service-list-view">
              <button
                v-for="service in filteredServices"
                :key="service.id"
                class="service-list-row"
                type="button"
                @click="addService(service)"
              >
                <span class="service-list-name">{{ service.name }}</span>
                <span class="service-list-meta">
                  <strong>{{ formatPrice(service.priceCents) }}</strong>
                  <span>Add</span>
                </span>
              </button>
            </div>
          </div>
          <p v-else class="empty-copy">No services match this search.</p>
        </section>

        <section class="checkout-section ticket-builder" aria-labelledby="ticket-title">
          <div class="section-heading pos-section-heading">
            <div>
              <p class="section-label">Ticket</p>
              <h2 id="ticket-title">Invoice items</h2>
            </div>
            <button class="btn-secondary add-manual-btn" type="button" @click="addManualItem">
              <Icon name="lucide:plus" aria-hidden="true" />
              Manual item
            </button>
          </div>

          <div v-if="!items.length" class="empty-ticket">
            <strong>No items yet</strong>
            <span>Pick a service above or add a manual item.</span>
          </div>

          <div v-else class="ticket-table">
            <div class="ticket-table-head" aria-hidden="true">
              <span>Item</span>
              <span>Staff</span>
              <span>Qty</span>
              <span>Price</span>
              <span>Amount</span>
              <span></span>
            </div>

            <div v-for="(item, index) in items" :key="`${item.serviceId ?? 'manual'}-${index}`" class="ticket-row">
              <label class="ticket-cell ticket-item-field">
                <span>Item</span>
                <input v-model="item.name" class="form-control item-name" aria-label="Item name" />
              </label>

              <label class="ticket-cell">
                <span>Staff</span>
                <select v-model="item.staffId" class="form-control" aria-label="Staff">
                  <option :value="null">No staff</option>
                  <option v-for="person in staff" :key="person.id" :value="person.id">{{ person.name }}</option>
                </select>
              </label>

              <label class="ticket-cell ticket-number-field">
                <span>Qty</span>
                <input
                  v-model.number="item.quantity"
                  class="form-control"
                  type="number"
                  min="1"
                  aria-label="Quantity"
                  @blur="normalizeQuantity(item)"
                />
              </label>

              <label class="ticket-cell ticket-number-field">
                <span>Price</span>
                <div class="money-input">
                  <span>$</span>
                  <input
                    :value="formatMoneyInput(item.unitPriceCents)"
                    inputmode="decimal"
                    aria-label="Unit price"
                    @input="updateItemPrice(item, $event)"
                  />
                </div>
              </label>

              <div class="ticket-amount">
                <span>Amount</span>
                <strong>{{ formatPrice(item.quantity * item.unitPriceCents) }}</strong>
              </div>

              <button class="icon-button remove-item-button" type="button" aria-label="Remove item" @click="removeItem(index)">
                <Icon name="lucide:trash-2" aria-hidden="true" />
              </button>
            </div>
          </div>
        </section>
      </section>

      <aside class="pos-summary surface-panel" aria-labelledby="summary-title">
        <div class="summary-total">
          <span id="summary-title">Total</span>
          <strong>{{ formatPrice(totals.totalCents) }}</strong>
        </div>

        <dl class="summary-list">
          <div><dt>Subtotal</dt><dd>{{ formatPrice(totals.subtotalCents) }}</dd></div>
          <div><dt>Discount</dt><dd>{{ formatPrice(totals.discountCents) }}</dd></div>
          <div><dt>Tax</dt><dd>{{ formatPrice(totals.taxCents) }}</dd></div>
          <div><dt>Tip</dt><dd>{{ formatPrice(totals.tipCents) }}</dd></div>
        </dl>

        <div class="summary-adjustments">
          <div class="promotion-control" aria-label="Promotion code">
            <label class="field">
              <span>Promotion code</span>
              <div class="promotion-input-row">
                <input
                  v-model="promotionCode"
                  class="form-control"
                  type="text"
                  placeholder="WELCOME10"
                  autocomplete="off"
                  @input="clearAppliedPromotion"
                  @keydown.enter.prevent="applyPromotionCode"
                />
                <button
                  class="btn-secondary"
                  type="button"
                  :disabled="promotionApplying || !promotionCode.trim() || !items.length"
                  @click="applyPromotionCode"
                >
                  {{ promotionApplying ? 'Checking...' : 'Apply' }}
                </button>
              </div>
            </label>
            <p v-if="promotionMessage" :class="['promotion-status', `promotion-status--${promotionStatus}`]">
              {{ promotionMessage }}
            </p>
          </div>

          <label class="field">
            <span>Discount</span>
            <div class="money-input">
              <span>$</span>
              <input
                :value="formatMoneyInput(discountCents)"
                inputmode="decimal"
                aria-label="Discount"
                @input="updateDiscount"
              />
            </div>
          </label>

          <label class="field">
            <span>Tip</span>
            <div class="money-input">
              <span>$</span>
              <input
                :value="formatMoneyInput(tipCents)"
                inputmode="decimal"
                aria-label="Tip"
                @input="updateTip"
              />
            </div>
          </label>
        </div>

        <button class="btn-primary summary-action" type="button" :disabled="!items.length || saving" @click="createInvoice">
          <Icon name="lucide:save" aria-hidden="true" />
          {{ saving ? 'Saving...' : 'Save invoice' }}
        </button>

        <p v-if="saveMessage" class="save-status" aria-live="polite">{{ saveMessage }}</p>
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

interface PosService {
  id: string
  name: string
  priceCents: number
}

interface PosStaff {
  id: string
  name: string
}

interface PosBooking {
  id: string
  customerName: string
  phone?: string | null
  email?: string | null
  promotionCode?: string | null
}

interface TicketItem {
  itemType: 'service' | 'manual'
  serviceId: string | null
  staffId: string | null
  name: string
  quantity: number
  unitPriceCents: number
}

type PromotionValidationResult =
  | {
      valid: true
      code: string
      name: string
      discountCents: number
      discountReason: string
    }
  | {
      valid: false
      code: string
      message: string
      discountCents: 0
    }

const config = useRuntimeConfig()
const baseUrl = config.public.apiBaseUrl
const route = useRoute()

const services = ref<PosService[]>([])
const staff = ref<PosStaff[]>([])
const serviceSearch = ref('')
const serviceViewMode = ref<'grid' | 'list'>('grid')
const discountCents = ref(0)
const tipCents = ref(0)
const taxRateBps = ref(825)
const saving = ref(false)
const saveMessage = ref('')
const items = ref<TicketItem[]>([])
const customerName = ref('Walk-in customer')
const promotionCode = ref('')
const appliedPromotionCode = ref('')
const promotionApplying = ref(false)
const promotionMessage = ref('')
const promotionStatus = ref<'success' | 'error' | 'idle'>('idle')

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

function addService(service: PosService) {
  clearAppliedPromotion()
  const existingItem = items.value.find((item) => item.itemType === 'service' && item.serviceId === service.id)
  if (existingItem) {
    existingItem.quantity += 1
    return
  }

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
  clearAppliedPromotion()
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
  clearAppliedPromotion()
  items.value.splice(index, 1)
}

function normalizeQuantity(item: TicketItem) {
  clearAppliedPromotion()
  if (!Number.isFinite(item.quantity) || item.quantity < 1) {
    item.quantity = 1
    return
  }
  item.quantity = Math.round(item.quantity)
}

function formatMoneyInput(cents: number) {
  return (Math.max(0, cents) / 100).toFixed(2)
}

function parseMoneyToCents(value: string) {
  const normalizedValue = value.replace(/[^\d.]/g, '')
  const parsedValue = Number.parseFloat(normalizedValue)
  if (!Number.isFinite(parsedValue)) return 0
  return Math.max(0, Math.round(parsedValue * 100))
}

function getInputValue(event: Event) {
  return event.target instanceof HTMLInputElement ? event.target.value : ''
}

function updateItemPrice(item: TicketItem, event: Event) {
  clearAppliedPromotion()
  item.unitPriceCents = parseMoneyToCents(getInputValue(event))
}

function updateDiscount(event: Event) {
  clearAppliedPromotion()
  discountCents.value = parseMoneyToCents(getInputValue(event))
}

function updateTip(event: Event) {
  tipCents.value = parseMoneyToCents(getInputValue(event))
}

function normalizePromotionCode(code: string) {
  return code.trim().toUpperCase()
}

function clearAppliedPromotion() {
  const hadAppliedPromotion = Boolean(appliedPromotionCode.value)
  if (!hadAppliedPromotion) {
    promotionMessage.value = ''
    promotionStatus.value = 'idle'
    return
  }

  appliedPromotionCode.value = ''
  discountCents.value = 0
  promotionMessage.value = promotionCode.value.trim()
    ? 'Apply the promotion again after changing the ticket.'
    : ''
  promotionStatus.value = 'idle'
}

async function applyPromotionCode() {
  const code = normalizePromotionCode(promotionCode.value)
  promotionCode.value = code
  appliedPromotionCode.value = ''
  discountCents.value = 0
  promotionMessage.value = ''

  if (!code) return false
  if (!items.value.length || totals.value.subtotalCents <= 0) {
    promotionStatus.value = 'error'
    promotionMessage.value = 'Add ticket items before applying a promotion.'
    return false
  }

  promotionApplying.value = true
  try {
    const result = await $fetch<PromotionValidationResult>(`${baseUrl}/public/promotions/validate`, {
      method: 'POST',
      body: {
        code,
        subtotalCents: totals.value.subtotalCents
      }
    })

    if (!result.valid) {
      promotionStatus.value = 'error'
      promotionMessage.value = result.message
      return false
    }

    appliedPromotionCode.value = result.code
    discountCents.value = result.discountCents
    promotionStatus.value = 'success'
    promotionMessage.value = `${result.name} applied: ${formatPrice(result.discountCents)} off.`
    return true
  } catch {
    promotionStatus.value = 'error'
    promotionMessage.value = 'Could not validate this promotion code.'
    return false
  } finally {
    promotionApplying.value = false
  }
}

async function loadData() {
  const [serviceRows, staffRows, settings, booking] = await Promise.all([
    $fetch<PosService[]>(`${baseUrl}/admin/services`, { credentials: 'include' }),
    $fetch<PosStaff[]>(`${baseUrl}/admin/staff`, { credentials: 'include' }),
    $fetch<{ taxRateBps?: number }>(`${baseUrl}/admin/shop-settings`, { credentials: 'include' }),
    bookingId.value
      ? $fetch<PosBooking>(`${baseUrl}/admin/bookings/${bookingId.value}`, { credentials: 'include' })
      : Promise.resolve(null)
  ])
  services.value = serviceRows
  staff.value = staffRows
  taxRateBps.value = settings.taxRateBps ?? 825
  if (booking) {
    customerName.value = booking.customerName
    promotionCode.value = booking.promotionCode ?? ''
    if (promotionCode.value) {
      promotionMessage.value = 'Booking promotion loaded. Add items, then apply it.'
      promotionStatus.value = 'idle'
    }
  }
}

async function createInvoice() {
  if (!items.value.length) return

  if (promotionCode.value.trim() && !appliedPromotionCode.value) {
    const applied = await applyPromotionCode()
    if (!applied) return
  }

  saving.value = true
  saveMessage.value = ''
  try {
    await $fetch(`${baseUrl}/admin/invoices`, {
      method: 'POST',
      credentials: 'include',
      body: {
        source: bookingId.value ? 'booking' : 'walk_in',
        bookingId: bookingId.value,
        customerName: customerName.value,
        items: items.value,
        promotionCode: appliedPromotionCode.value || undefined,
        discountCents: discountCents.value,
        tipCents: tipCents.value
      }
    })
    items.value = []
    discountCents.value = 0
    tipCents.value = 0
    appliedPromotionCode.value = ''
    promotionCode.value = ''
    promotionMessage.value = ''
    saveMessage.value = 'Invoice saved.'
  } finally {
    saving.value = false
  }
}

onMounted(loadData)
</script>

<style scoped>
.pos-header {
  margin-bottom: 1.25rem;
}

.pos-header h1 {
  margin: 0.3rem 0 0;
  font-size: clamp(2.4rem, 5vw, 3.6rem);
}

.pos-header p:not(.eyebrow) {
  color: var(--color-muted);
  margin: 0.4rem 0 0;
}

.pos-workspace {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(280px, 0.34fr);
  gap: 1rem;
  align-items: start;
}

.checkout-column,
.pos-summary {
  padding: 1rem;
}

.checkout-section + .checkout-section {
  border-top: 1px solid var(--color-border);
  margin-top: 1rem;
  padding-top: 1rem;
}

.pos-section-heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 0.85rem;
}

.pos-section-heading h2 {
  margin: 0.2rem 0 0;
  font-size: 1.1rem;
}

.pos-section-heading > span {
  color: var(--color-muted);
  font-size: 0.82rem;
  font-weight: 800;
  white-space: nowrap;
}

.service-heading-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.service-heading-actions > span {
  color: var(--color-muted);
  font-size: 0.82rem;
  font-weight: 800;
  white-space: nowrap;
}

.service-view-toggle {
  display: inline-flex;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-card);
  background: var(--color-bg-strong);
  padding: 0.2rem;
}

.view-toggle-button {
  min-height: 2rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.35rem;
  border: 0;
  border-radius: calc(var(--radius-card) - 2px);
  background: transparent;
  color: var(--color-muted);
  font: inherit;
  font-size: 0.8rem;
  font-weight: 900;
  padding: 0.35rem 0.55rem;
}

.view-toggle-button.active {
  background: var(--color-primary);
  color: #fff8ef;
}

.view-toggle-button:hover:not(.active) {
  color: var(--color-ink);
  background: var(--color-surface-strong);
}

.search-field,
.field {
  display: grid;
  gap: 0.35rem;
}

.search-field span,
.field span,
.ticket-cell span,
.ticket-amount span {
  color: var(--color-ink-soft);
  font-size: 0.76rem;
  font-weight: 800;
}

.service-scroll {
  max-height: clamp(18rem, 42vh, 30rem);
  overflow-y: auto;
  margin-top: 0.75rem;
  padding-right: 0.25rem;
  scrollbar-gutter: stable;
}

.service-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
  gap: 0.55rem;
}

.service-pick-card {
  width: 100%;
  min-height: 4.15rem;
  display: grid;
  gap: 0.45rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-card);
  background: var(--color-surface-strong);
  color: var(--color-ink);
  padding: 0.75rem;
  text-align: left;
}

.service-pick-card:hover {
  border-color: var(--color-primary);
  box-shadow: 0 10px 24px rgba(72, 49, 39, 0.08);
}

.service-name {
  font-weight: 900;
  line-height: 1.25;
}

.service-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  color: var(--color-muted);
  font-size: 0.82rem;
  font-weight: 800;
}

.service-meta strong {
  color: var(--color-primary);
  font-size: 0.95rem;
}

.service-list-view {
  display: grid;
  gap: 0.45rem;
}

.service-list-row {
  width: 100%;
  min-height: 3.2rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-card);
  background: var(--color-surface-strong);
  color: var(--color-ink);
  padding: 0.65rem 0.75rem;
  text-align: left;
}

.service-list-row:hover {
  border-color: var(--color-primary);
  background: #fff;
}

.service-list-name {
  font-weight: 900;
  line-height: 1.25;
}

.service-list-meta {
  display: inline-flex;
  align-items: center;
  gap: 0.75rem;
  color: var(--color-muted);
  font-size: 0.82rem;
  font-weight: 800;
  white-space: nowrap;
}

.service-list-meta strong {
  color: var(--color-primary);
  font-size: 0.95rem;
}

.add-manual-btn,
.summary-action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.45rem;
}

.add-manual-btn {
  min-height: 2.45rem;
  padding: 0.45rem 0.7rem;
}

.empty-copy,
.empty-ticket {
  color: var(--color-muted);
}

.empty-ticket {
  display: grid;
  gap: 0.3rem;
  border: 1px dashed var(--color-border);
  border-radius: var(--radius-card);
  background: var(--color-bg-strong);
  padding: 1rem;
}

.empty-ticket strong {
  color: var(--color-ink);
}

.ticket-table {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-card);
  overflow: hidden;
}

.ticket-table-head,
.ticket-row {
  display: grid;
  grid-template-columns: minmax(180px, 1.4fr) minmax(130px, 0.85fr) 4.6rem 6.6rem 5.8rem 2.8rem;
  gap: 0.65rem;
  align-items: center;
}

.ticket-table-head {
  background: var(--color-bg-strong);
  color: var(--color-muted);
  font-size: 0.72rem;
  font-weight: 900;
  letter-spacing: 0.06em;
  padding: 0.65rem 0.8rem;
  text-transform: uppercase;
}

.ticket-row {
  border-top: 1px solid var(--color-border);
  padding: 0.7rem 0.8rem;
}

.ticket-cell {
  display: grid;
  gap: 0.28rem;
}

.ticket-cell span {
  display: none;
}

.item-name {
  font-weight: 900;
}

.ticket-number-field .form-control {
  text-align: right;
}

.ticket-amount {
  display: grid;
  gap: 0.28rem;
  color: var(--color-ink);
  font-weight: 900;
  text-align: right;
}

.ticket-amount span {
  display: none;
}

.money-input {
  min-height: 2.55rem;
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: center;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-card);
  background: var(--color-surface-strong);
  overflow: hidden;
}

.money-input > span {
  color: var(--color-muted);
  font-size: 0.9rem;
  font-weight: 900;
  padding-left: 0.75rem;
}

.money-input input {
  width: 100%;
  min-width: 0;
  border: 0;
  background: transparent;
  color: var(--color-ink);
  font: inherit;
  font-weight: 800;
  outline: 0;
  padding: 0.7rem 0.75rem 0.7rem 0.35rem;
  text-align: right;
}

.icon-button {
  width: 2.35rem;
  height: 2.35rem;
  display: inline-grid;
  place-items: center;
  border: 1px solid var(--color-border);
  border-radius: 999px;
  background: var(--color-surface-strong);
  color: var(--color-primary);
}

.icon-button:hover {
  border-color: var(--color-primary);
  background: #f7ebe4;
}

.pos-summary {
  position: sticky;
  top: 1rem;
}

.summary-total {
  border-radius: var(--radius-card);
  background: var(--color-ink);
  color: #fff8ef;
  padding: 1rem;
}

.summary-total span {
  display: block;
  color: rgba(255, 248, 239, 0.72);
  font-size: 0.78rem;
  font-weight: 800;
  text-transform: uppercase;
}

.summary-total strong {
  display: block;
  font-family: Georgia, "Times New Roman", serif;
  font-size: clamp(2rem, 4vw, 3rem);
  line-height: 1;
  margin-top: 0.35rem;
}

.summary-list {
  display: grid;
  gap: 0.6rem;
  margin: 1rem 0;
}

.summary-list div {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
}

.summary-list dt {
  color: var(--color-muted);
  font-weight: 800;
}

.summary-list dd {
  margin: 0;
  font-weight: 900;
}

.summary-adjustments {
  display: grid;
  gap: 0.75rem;
  border-top: 1px solid var(--color-border);
  padding-top: 1rem;
}

.promotion-control {
  display: grid;
  gap: 0.45rem;
}

.promotion-input-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 0.5rem;
}

.promotion-input-row .btn-secondary {
  min-width: 5.8rem;
  padding-right: 0.75rem;
  padding-left: 0.75rem;
}

.promotion-status {
  margin: 0;
  color: var(--color-muted);
  font-size: 0.82rem;
  font-weight: 800;
  line-height: 1.45;
}

.promotion-status--success {
  color: var(--color-success);
}

.promotion-status--error {
  color: var(--color-danger);
}

.summary-action {
  width: 100%;
  min-height: 3rem;
  margin-top: 1rem;
}

.save-status {
  min-height: 1.4rem;
  color: var(--color-success);
  font-size: 0.85rem;
  font-weight: 800;
  margin: 0.75rem 0 0;
}

@media (max-width: 1180px) {
  .pos-workspace {
    grid-template-columns: 1fr;
  }

  .pos-summary {
    position: static;
  }
}

@media (max-width: 780px) {
  .checkout-column,
  .pos-summary {
    padding: 0.85rem;
  }

  .pos-section-heading {
    display: grid;
  }

  .service-heading-actions {
    justify-content: flex-start;
  }

  .service-view-toggle {
    width: 100%;
  }

  .view-toggle-button {
    flex: 1;
  }

  .service-scroll {
    max-height: min(55vh, 28rem);
    padding-right: 0;
  }

  .service-grid {
    grid-template-columns: 1fr;
  }

  .promotion-input-row {
    grid-template-columns: 1fr;
  }

  .ticket-table {
    border: 0;
    border-radius: 0;
    overflow: visible;
  }

  .ticket-table-head {
    display: none;
  }

  .ticket-row {
    grid-template-columns: 1fr;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-card);
    margin-bottom: 0.75rem;
    padding: 0.85rem;
  }

  .ticket-cell span,
  .ticket-amount span {
    display: block;
  }

  .ticket-amount {
    text-align: left;
  }

  .remove-item-button {
    justify-self: end;
  }
}
</style>
