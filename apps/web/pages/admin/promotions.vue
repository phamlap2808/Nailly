<template>
  <AdminShell>
    <div class="admin-page-header">
      <div>
        <p class="eyebrow">Revenue</p>
        <h1 class="display-title">Promotions</h1>
        <p>Create discount codes customers can use during booking or checkout.</p>
      </div>
      <button class="btn-primary" type="button" @click="openCreate">New code</button>
    </div>

    <div v-if="loading" class="loading-state surface-panel">Loading promotions...</div>

    <div v-else class="promotions-layout">
      <section class="promotion-library surface-panel" aria-labelledby="promotion-library-title">
        <div class="library-header">
          <div>
            <p class="eyebrow">Library</p>
            <h2 id="promotion-library-title">Promotion codes</h2>
          </div>
          <span>{{ promotions.length }} codes</span>
        </div>

        <div v-if="!promotions.length" class="empty-state">No promotion codes created yet.</div>

        <div v-else class="promotion-table" role="table" aria-label="Promotion codes">
          <div class="promotion-table-head" role="row">
            <span>Code</span>
            <span>Discount</span>
            <span>Minimum</span>
            <span>Usage</span>
            <span>Status</span>
            <span />
          </div>
          <div v-for="promotion in promotions" :key="promotion.id" class="promotion-row" role="row">
            <div class="promotion-code-cell">
              <strong>{{ promotion.code }}</strong>
              <span>{{ promotion.name }}</span>
            </div>
            <span class="promotion-meta">{{ formatPromotionDiscount(promotion) }}</span>
            <span class="promotion-meta">{{ formatPrice(promotion.minSubtotalCents) }}</span>
            <span class="promotion-meta">{{ formatUsage(promotion) }}</span>
            <span :class="['status-pill', promotion.active ? 'status-pill--active' : 'status-pill--inactive']">
              {{ promotion.active ? 'Active' : 'Inactive' }}
            </span>
            <button class="btn-secondary action-btn" type="button" @click="openEdit(promotion)">Edit</button>
          </div>
        </div>
      </section>

      <aside class="promotion-editor surface-panel editor-shell" aria-labelledby="promotion-editor-title">
        <div class="editor-heading">
          <div>
            <p class="eyebrow">Editor</p>
            <h2 id="promotion-editor-title">{{ editing ? 'Edit code' : 'New code' }}</h2>
          </div>
          <span class="editor-code-pill">{{ editing?.code || 'Draft' }}</span>
        </div>

        <div class="editor-status-row">
          <div>
            <strong>{{ form.active ? 'Active code' : 'Inactive code' }}</strong>
            <span>{{ form.active ? 'Available for booking and POS.' : 'Hidden from checkout validation.' }}</span>
          </div>
          <label class="switch-field">
            <input v-model="form.active" type="checkbox" />
            <span aria-hidden="true" />
          </label>
        </div>

        <form class="promotion-form" @submit.prevent="handleSave">
          <section class="editor-section" aria-labelledby="offer-section-title">
            <div class="editor-section-heading">
              <span>01</span>
              <h3 id="offer-section-title">Offer</h3>
            </div>

            <div class="offer-grid">
              <label class="field code-field">
                <span>Promotion code</span>
                <input
                  v-model="form.code"
                  class="form-control"
                  required
                  autocomplete="off"
                  placeholder="WELCOME10"
                  @blur="form.code = form.code.trim().toUpperCase()"
                />
              </label>

              <label class="field">
                <span>Name</span>
                <input v-model="form.name" class="form-control" required placeholder="Welcome offer" />
              </label>

              <label class="field">
                <span>Type</span>
                <select v-model="form.discountType" class="form-control">
                  <option value="percent">Percent</option>
                  <option value="fixed">Fixed amount</option>
                </select>
              </label>

              <label class="field">
                <span>{{ discountValueLabel }}</span>
                <div
                  :class="[
                    'discount-input-shell',
                    form.discountType === 'fixed' ? 'discount-input-shell--prefix' : 'discount-input-shell--suffix'
                  ]"
                >
                  <span v-if="form.discountType === 'fixed'" class="discount-addon discount-addon--prefix">$</span>
                  <input
                    v-model="form.discountValue"
                    type="number"
                    required
                    min="0"
                    :max="form.discountType === 'percent' ? 100 : undefined"
                    :step="form.discountType === 'percent' ? 1 : 0.01"
                  />
                  <span v-if="form.discountType === 'percent'" class="discount-addon discount-addon--suffix">%</span>
                </div>
              </label>
            </div>
          </section>

          <section class="editor-section" aria-labelledby="rules-section-title">
            <div class="editor-section-heading">
              <span>02</span>
              <h3 id="rules-section-title">Rules</h3>
            </div>

            <div class="rules-grid">
              <label class="field">
                <span>Minimum subtotal</span>
                <input v-model="form.minSubtotal" class="form-control" type="number" min="0" step="0.01" />
              </label>

              <label class="field">
                <span>Max discount</span>
                <input v-model="form.maxDiscount" class="form-control" type="number" min="0" step="0.01" placeholder="No cap" />
              </label>

              <label class="field">
                <span>Usage limit</span>
                <input v-model="form.usageLimit" class="form-control" type="number" min="1" step="1" placeholder="Unlimited" />
              </label>
            </div>

            <div class="date-range-grid">
              <label class="field">
                <span>Starts at</span>
                <input v-model="form.startsAt" class="form-control" type="datetime-local" />
              </label>

              <label class="field">
                <span>Ends at</span>
                <input v-model="form.endsAt" class="form-control" type="datetime-local" />
              </label>
            </div>
          </section>

          <p v-if="errorMessage" class="form-error">{{ errorMessage }}</p>
          <p v-if="saveMessage" class="form-success">{{ saveMessage }}</p>

          <div class="editor-actions">
            <button v-if="editing" class="btn-secondary" type="button" @click="openCreate">Cancel edit</button>
            <button class="btn-primary" type="submit" :disabled="saving">
              {{ saving ? 'Saving...' : editing ? 'Update code' : 'Create code' }}
            </button>
          </div>
        </form>
      </aside>
    </div>
  </AdminShell>
</template>

<script setup lang="ts">
import type { PromotionDiscountType } from '@nailly/shared'
import { formatPrice } from '../../utils/format'
import { resolveRuntimeApiBaseUrl } from '../../utils/api-url'

definePageMeta({
  middleware: 'admin-auth',
  layout: false
})

interface PromotionRow {
  id: string
  code: string
  name: string
  discountType: PromotionDiscountType
  discountValue: number
  minSubtotalCents: number
  maxDiscountCents: number | null
  startsAt: string | null
  endsAt: string | null
  usageLimit: number | null
  usedCount: number
  active: boolean
}

const config = useRuntimeConfig()
const baseUrl = resolveRuntimeApiBaseUrl(config, import.meta.server)
const requestHeaders = import.meta.server ? useRequestHeaders(['cookie']) : undefined

const promotions = ref<PromotionRow[]>([])
const loading = ref(true)
const saving = ref(false)
const editing = ref<PromotionRow | null>(null)
const saveMessage = ref('')
const errorMessage = ref('')

const form = reactive({
  code: '',
  name: '',
  discountType: 'percent' as PromotionDiscountType,
  discountValue: '10',
  minSubtotal: '0',
  maxDiscount: '',
  startsAt: '',
  endsAt: '',
  usageLimit: '',
  active: true
})

const discountValueLabel = computed(() =>
  form.discountType === 'percent' ? 'Percent off' : 'Amount off'
)

function moneyStringToCents(value: string) {
  const parsed = Number.parseFloat(value)
  if (!Number.isFinite(parsed)) return 0
  return Math.max(0, Math.round(parsed * 100))
}

function optionalMoneyStringToCents(value: string) {
  if (!value.trim()) return null
  return moneyStringToCents(value)
}

function optionalInteger(value: string) {
  if (!value.trim()) return null
  const parsed = Number.parseInt(value, 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null
}

function toDateTimeLocal(value: string | null) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
  return localDate.toISOString().slice(0, 16)
}

function localDateTimeToIso(value: string) {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date.toISOString()
}

function formatMoneyInput(cents: number | null) {
  if (cents === null) return ''
  return (cents / 100).toFixed(2)
}

function formatPromotionDiscount(promotion: PromotionRow) {
  const value = promotion.discountType === 'percent'
    ? `${promotion.discountValue}%`
    : formatPrice(promotion.discountValue)
  const cap = promotion.maxDiscountCents === null
    ? ''
    : `, cap ${formatPrice(promotion.maxDiscountCents)}`

  return `${value} off${cap}`
}

function formatUsage(promotion: PromotionRow) {
  if (promotion.usageLimit === null) return `${promotion.usedCount} used`
  return `${promotion.usedCount} / ${promotion.usageLimit}`
}

function resetMessages() {
  saveMessage.value = ''
  errorMessage.value = ''
}

async function fetchPromotions() {
  loading.value = true
  promotions.value = await $fetch<PromotionRow[]>(`${baseUrl}/admin/promotions`, {
    credentials: 'include',
    headers: requestHeaders
  })
  loading.value = false
}

function openCreate() {
  editing.value = null
  form.code = ''
  form.name = ''
  form.discountType = 'percent'
  form.discountValue = '10'
  form.minSubtotal = '0'
  form.maxDiscount = ''
  form.startsAt = ''
  form.endsAt = ''
  form.usageLimit = ''
  form.active = true
  resetMessages()
}

function openEdit(promotion: PromotionRow) {
  editing.value = promotion
  form.code = promotion.code
  form.name = promotion.name
  form.discountType = promotion.discountType
  form.discountValue = promotion.discountType === 'percent'
    ? String(promotion.discountValue)
    : formatMoneyInput(promotion.discountValue)
  form.minSubtotal = formatMoneyInput(promotion.minSubtotalCents)
  form.maxDiscount = formatMoneyInput(promotion.maxDiscountCents)
  form.startsAt = toDateTimeLocal(promotion.startsAt)
  form.endsAt = toDateTimeLocal(promotion.endsAt)
  form.usageLimit = promotion.usageLimit === null ? '' : String(promotion.usageLimit)
  form.active = promotion.active
  resetMessages()
}

function buildPromotionPayload() {
  return {
    code: form.code.trim().toUpperCase(),
    name: form.name.trim(),
    discountType: form.discountType,
    discountValue: form.discountType === 'percent'
      ? Math.round(Number.parseFloat(form.discountValue) || 0)
      : moneyStringToCents(form.discountValue),
    minSubtotalCents: moneyStringToCents(form.minSubtotal),
    maxDiscountCents: optionalMoneyStringToCents(form.maxDiscount),
    startsAt: localDateTimeToIso(form.startsAt),
    endsAt: localDateTimeToIso(form.endsAt),
    usageLimit: optionalInteger(form.usageLimit),
    active: form.active
  }
}

async function handleSave() {
  resetMessages()
  saving.value = true
  try {
    const payload = buildPromotionPayload()
    if (editing.value) {
      await $fetch(`${baseUrl}/admin/promotions/${editing.value.id}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: requestHeaders,
        body: payload
      })
      saveMessage.value = 'Promotion updated.'
    } else {
      await $fetch(`${baseUrl}/admin/promotions`, {
        method: 'POST',
        credentials: 'include',
        headers: requestHeaders,
        body: payload
      })
      saveMessage.value = 'Promotion created.'
    }
    await fetchPromotions()
    if (!editing.value) {
      openCreate()
      saveMessage.value = 'Promotion created.'
    }
  } catch (error: unknown) {
    const fetchError = error as { data?: { error?: { message?: string } } }
    errorMessage.value = fetchError?.data?.error?.message ?? 'Could not save this promotion.'
  } finally {
    saving.value = false
  }
}

await fetchPromotions()
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

.promotions-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(320px, 0.38fr);
  gap: 1rem;
  align-items: start;
}

.promotion-library,
.promotion-editor {
  padding: 1rem;
}

.editor-shell {
  display: grid;
  gap: 1rem;
  overflow: hidden;
}

.library-header,
.editor-heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1rem;
}

.library-header h2,
.editor-heading h2 {
  margin: 0.2rem 0 0;
  font-size: 1.2rem;
}

.library-header > span,
.editor-heading > span {
  color: var(--color-muted);
  font-size: 0.82rem;
  font-weight: 800;
  white-space: nowrap;
}

.editor-code-pill {
  max-width: 10rem;
  overflow: hidden;
  border: 1px solid var(--color-border);
  border-radius: 999px;
  background: var(--color-surface-strong);
  color: var(--color-primary);
  padding: 0.28rem 0.65rem;
  text-overflow: ellipsis;
}

.editor-status-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 0.75rem;
  align-items: center;
  border: 1px solid rgba(223, 208, 195, 0.82);
  border-radius: var(--radius-card);
  background: #fff;
  padding: 0.8rem;
}

.editor-status-row strong {
  display: block;
  color: var(--color-ink);
  font-size: 0.92rem;
  line-height: 1.25;
}

.editor-status-row span {
  color: var(--color-muted);
  font-size: 0.82rem;
}

.switch-field {
  position: relative;
  width: 3rem;
  height: 1.7rem;
  display: inline-block;
  flex: 0 0 auto;
}

.switch-field input {
  position: absolute;
  inset: 0;
  opacity: 0;
}

.switch-field span {
  position: absolute;
  inset: 0;
  border-radius: 999px;
  background: #ddd2ca;
  cursor: pointer;
  transition: background 0.15s ease;
}

.switch-field span::after {
  content: "";
  position: absolute;
  top: 0.25rem;
  left: 0.25rem;
  width: 1.2rem;
  height: 1.2rem;
  border-radius: 999px;
  background: #fff;
  box-shadow: 0 1px 4px rgba(43, 33, 29, 0.18);
  transition: transform 0.15s ease;
}

.switch-field input:checked + span {
  background: var(--color-primary);
}

.switch-field input:checked + span::after {
  transform: translateX(1.3rem);
}

.promotion-table {
  display: grid;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-card);
  overflow: hidden;
}

.promotion-table-head,
.promotion-row {
  display: grid;
  grid-template-columns: minmax(220px, 1.2fr) minmax(150px, 0.85fr) 110px 110px 100px auto;
  gap: 1rem;
  align-items: center;
  padding: 0.85rem 1rem;
}

.promotion-table-head {
  background: rgba(239, 226, 214, 0.55);
  color: var(--color-muted);
  font-size: 0.75rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.promotion-row {
  border-top: 1px solid var(--color-border);
  background: var(--color-surface-strong);
}

.promotion-row:first-of-type {
  border-top: none;
}

.promotion-code-cell {
  min-width: 0;
  display: grid;
  gap: 0.15rem;
}

.promotion-code-cell strong {
  color: var(--color-ink);
  letter-spacing: 0.05em;
}

.promotion-code-cell span,
.promotion-meta {
  color: var(--color-muted);
  font-size: 0.9rem;
  font-weight: 750;
}

.status-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 1.6rem;
  border-radius: 999px;
  padding: 0.2rem 0.65rem;
  font-size: 0.74rem;
  font-weight: 800;
}

.status-pill--active {
  background: #e6f0e7;
  color: var(--color-success);
}

.status-pill--inactive {
  background: #ede9e3;
  color: var(--color-muted);
}

.action-btn {
  min-height: 2rem;
  padding: 0.35rem 0.7rem;
}

.promotion-form {
  display: grid;
  gap: 1rem;
}

.editor-section {
  display: grid;
  gap: 0.75rem;
  border-top: 1px solid var(--color-border);
  padding-top: 1rem;
}

.editor-section-heading {
  display: flex;
  align-items: center;
  gap: 0.55rem;
}

.editor-section-heading span {
  display: inline-grid;
  width: 1.75rem;
  height: 1.75rem;
  place-items: center;
  border-radius: 999px;
  background: var(--color-bg-strong);
  color: var(--color-primary);
  font-size: 0.72rem;
  font-weight: 900;
}

.editor-section-heading h3 {
  margin: 0;
  color: var(--color-ink);
  font-size: 0.98rem;
}

.field {
  min-width: 0;
  display: grid;
  gap: 0.35rem;
}

.field span {
  color: var(--color-ink-soft);
  font-size: 0.85rem;
  font-weight: 700;
}

.offer-grid,
.rules-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.75rem;
}

.code-field {
  grid-column: 1 / -1;
}

.discount-input-shell {
  min-width: 0;
  min-height: 3rem;
  display: grid;
  align-items: center;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-card);
  background: var(--color-surface-strong);
  overflow: hidden;
}

.discount-input-shell--prefix {
  grid-template-columns: auto minmax(0, 1fr);
}

.discount-input-shell--suffix {
  grid-template-columns: minmax(0, 1fr) auto;
}

.discount-addon {
  min-width: 2.75rem;
  height: 100%;
  display: inline-grid;
  place-items: center;
  background: var(--color-bg-strong);
  color: var(--color-ink-soft);
  font-size: 0.9rem;
  font-weight: 900;
}

.discount-addon--prefix {
  border-right: 1px solid var(--color-border);
}

.discount-addon--suffix {
  border-left: 1px solid var(--color-border);
}

.discount-input-shell input {
  width: 100%;
  min-width: 0;
  border: 0;
  background: transparent;
  color: var(--color-ink);
  font: inherit;
  outline: 0;
  padding: 0.7rem 0.85rem;
}

.date-range-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 0.75rem;
}

.date-range-grid input {
  min-width: 0;
  overflow: hidden;
}

.editor-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  padding-top: 0.35rem;
}

.form-error,
.form-success {
  border-radius: var(--radius-card);
  margin: 0;
  padding: 0.75rem 0.9rem;
  font-size: 0.88rem;
  font-weight: 800;
}

.form-error {
  border: 1px solid #efcac5;
  background: #fbebe8;
  color: var(--color-danger);
}

.form-success {
  border: 1px solid #c9e5cf;
  background: #edf7ef;
  color: var(--color-success);
}

.loading-state,
.empty-state {
  color: var(--color-muted);
  padding: 2rem;
}

.empty-state {
  border: 1px dashed var(--color-border);
  border-radius: var(--radius-card);
}

@media (max-width: 1180px) {
  .promotions-layout {
    grid-template-columns: 1fr;
  }

  .promotion-table-head {
    display: none;
  }

  .promotion-row {
    grid-template-columns: 1fr;
    gap: 0.6rem;
  }

  .action-btn {
    justify-self: start;
  }
}

@media (max-width: 640px) {
  .admin-page-header,
  .date-range-grid,
  .editor-actions,
  .offer-grid,
  .rules-grid {
    grid-template-columns: 1fr;
    display: grid;
  }

  .admin-page-header > .btn-primary,
  .editor-actions button {
    width: 100%;
  }
}
</style>
