<template>
  <div class="booking-layout">
    <form class="booking-form surface-panel" @submit.prevent="handleSubmit">
      <div v-if="success" class="form-success">{{ $t('booking.success') }}</div>
      <div v-if="error" class="form-error">{{ error }}</div>

      <div v-if="!success" class="form-fields">
        <section class="form-section">
          <div class="section-heading">
            <span>1</span>
            <div>
              <p class="eyebrow">Services</p>
              <h2>Choose your treatment</h2>
            </div>
          </div>
          <div class="service-picker-controls">
            <label class="field service-search">
              <span>Search treatment</span>
              <input
                v-model="serviceSearchQuery"
                class="form-control"
                type="search"
                placeholder="Search by name or description"
                @keydown.enter.prevent
              />
            </label>
            <span class="service-result-count">{{ serviceResultLabel }}</span>
          </div>
          <div v-if="visibleServices.length" class="service-options">
            <label
              v-for="svc in visibleServices"
              :key="svc.id"
              :class="['service-option', { selected: form.serviceIds.includes(svc.id) }]"
            >
              <input
                type="checkbox"
                :value="svc.id"
                :checked="form.serviceIds.includes(svc.id)"
                @change="toggleService(svc.id)"
              />
              <span class="service-option-copy">
                <strong>{{ svc.name }}</strong>
                <small v-if="svc.description">{{ svc.description }}</small>
              </span>
              <span class="service-option-meta">
                <span>{{ svc.durationMinutes }} min</span>
                <strong>{{ formatPrice(svc.priceCents) }}</strong>
              </span>
            </label>
          </div>
          <p v-else class="service-empty-state">No treatments match your search.</p>
        </section>

        <section class="form-section">
          <div class="section-heading">
            <span>2</span>
            <div>
              <p class="eyebrow">Schedule</p>
              <h2>Pick a time</h2>
            </div>
          </div>
          <div class="field-grid">
            <label class="field">
              <span>Date *</span>
              <input v-model="form.appointmentDate" class="form-control" type="date" required :min="today" />
            </label>
            <label class="field">
              <span>Preferred staff</span>
              <select v-model="form.staffId" class="form-control">
                <option :value="null">Any available</option>
                <option v-for="s in staff" :key="s.id" :value="s.id">{{ s.name }}</option>
              </select>
            </label>
          </div>
          <div class="field">
            <span>Time *</span>
            <TimeSlotGrid
              v-model="form.startTime"
              :slots="slotTimes"
              :unavailable-slots="unavailableSlots"
              :loading="loadingSlots"
            />
          </div>
        </section>

        <section class="form-section">
          <div class="section-heading">
            <span>3</span>
            <div>
              <p class="eyebrow">Details</p>
              <h2>How can we reach you?</h2>
            </div>
          </div>
          <div class="field-grid">
            <label class="field">
              <span>Name *</span>
              <input v-model="form.customerName" class="form-control" type="text" required placeholder="Your full name" />
            </label>
            <label class="field">
              <span>Phone *</span>
              <input v-model="form.phone" class="form-control" type="tel" required placeholder="+1 555 0100" />
            </label>
            <label class="field">
              <span>Email</span>
              <input v-model="form.email" class="form-control" type="email" placeholder="Optional" />
            </label>
            <label class="field">
              <span>Party size</span>
              <select v-model.number="form.partySize" class="form-control">
                <option v-for="n in 6" :key="n" :value="n">{{ n }}</option>
              </select>
            </label>
          </div>
          <label class="field">
            <span>Note</span>
            <textarea v-model="form.note" class="form-control" rows="3" placeholder="Any special requests..." />
          </label>
        </section>

        <button type="submit" class="btn-primary submit-btn" :disabled="submitting">
          {{ submitting ? 'Submitting...' : $t('booking.submit') }}
        </button>
      </div>
    </form>

    <aside class="booking-summary surface-panel">
      <p class="eyebrow">Your visit</p>
      <h2>{{ summary.serviceLabel }}</h2>
      <dl>
        <div><dt>Duration</dt><dd>{{ summary.durationLabel }}</dd></div>
        <div><dt>Date</dt><dd>{{ summary.dateLabel }}</dd></div>
        <div><dt>Time</dt><dd>{{ summary.timeLabel }}</dd></div>
        <div><dt>Party</dt><dd>{{ summary.partyLabel }}</dd></div>
        <div><dt>Total</dt><dd>{{ formatPrice(summary.totalPriceCents) }}</dd></div>
      </dl>
      <div v-if="shop" class="shop-summary">
        <strong>{{ shop.name }}</strong>
        <span v-if="shop.address">{{ shop.address }}</span>
        <span v-if="shop.phone">{{ shop.phone }}</span>
      </div>
    </aside>
  </div>
</template>

<script setup lang="ts">
import { formatPrice } from '../utils/format'
import { buildBookingPayload } from '../utils/booking-payload'
import { buildBookingSummary } from '../utils/booking-summary'
import { filterBookingServices, type BookingPickerService } from '../utils/booking-service-picker'
import { getAvailabilitySlotState, hasAvailableSlot, type AvailabilitySlot } from '../utils/availability-slots'
import type { CreateBookingInput } from '@nailly/shared'

const config = useRuntimeConfig()
const baseUrl = config.public.apiBaseUrl

const props = defineProps<{
  services: BookingPickerService[]
  staff: Array<{ id: string; name: string }>
  shop: { name: string; address: string; phone: string } | null
}>()

const today = computed(() => new Date().toISOString().slice(0, 10))

const form = reactive({
  customerName: '',
  phone: '',
  email: '',
  partySize: 1,
  serviceIds: [] as string[],
  staffId: null as string | null,
  appointmentDate: '',
  startTime: null as string | null,
  note: ''
})

const serviceSearchQuery = ref('')
const visibleServices = computed(() => filterBookingServices(props.services, serviceSearchQuery.value))
const serviceResultLabel = computed(() => {
  if (!props.services.length) return 'No treatments available'
  if (!visibleServices.value.length) return 'No matches'

  const selectedCount = form.serviceIds.length
  const resultCount = serviceSearchQuery.value.trim()
    ? `${visibleServices.value.length} of ${props.services.length}`
    : `${props.services.length}`
  const selectedLabel = selectedCount === 1 ? '1 selected' : `${selectedCount} selected`

  return selectedCount ? `${resultCount} treatments · ${selectedLabel}` : `${resultCount} treatments`
})

const summary = computed(() =>
  buildBookingSummary({
    services: props.services,
    selectedServiceIds: form.serviceIds,
    appointmentDate: form.appointmentDate,
    startTime: form.startTime,
    partySize: form.partySize
  })
)

const submitting = ref(false)
const success = ref(false)
const error = ref('')

function toggleService(id: string) {
  const idx = form.serviceIds.indexOf(id)
  if (idx === -1) form.serviceIds.push(id)
  else form.serviceIds.splice(idx, 1)
}

const availableSlots = ref<AvailabilitySlot[]>([])
const slotState = computed(() => getAvailabilitySlotState(availableSlots.value))
const slotTimes = computed(() => slotState.value.times)
const unavailableSlots = computed(() => slotState.value.unavailableSlots)
const loadingSlots = ref(false)

watch(
  () => [form.appointmentDate, form.serviceIds.join(','), form.staffId] as const,
  async ([date, serviceIdsCsv, staffId]) => {
    if (!date || !serviceIdsCsv) {
      availableSlots.value = []
      form.startTime = null
      return
    }
    loadingSlots.value = true
    try {
      const params = new URLSearchParams({ date, serviceIds: serviceIdsCsv })
      if (staffId) params.set('staffId', staffId)
      const res = await $fetch<{ slots: AvailabilitySlot[] }>(`${baseUrl}/public/availability?${params}`)
      availableSlots.value = res.slots
      if (!hasAvailableSlot(res.slots, form.startTime)) {
        form.startTime = null
      }
    } catch {
      availableSlots.value = []
    } finally {
      loadingSlots.value = false
    }
  }
)

async function handleSubmit() {
  error.value = ''
  if (!form.serviceIds.length || !form.startTime) {
    error.value = 'Please choose at least one service and an available time.'
    return
  }

  submitting.value = true
  try {
    const payload = buildBookingPayload({
      ...form,
      startTime: form.startTime,
      staffId: form.staffId
    } as CreateBookingInput)

    await $fetch(`${baseUrl}/public/bookings`, {
      method: 'POST',
      body: payload
    })
    success.value = true
  } catch (e: unknown) {
    const fetchError = e as { data?: { error?: { message?: string } } }
    error.value = fetchError?.data?.error?.message ?? 'Something went wrong. Please try again.'
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.booking-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 320px;
  gap: 1.25rem;
  align-items: start;
}

.booking-form,
.booking-summary {
  padding: 1.25rem;
}

.booking-summary {
  position: sticky;
  top: 6rem;
}

.booking-summary h2 {
  margin: 0.35rem 0 1rem;
  font-family: Georgia, "Times New Roman", serif;
  line-height: 1.1;
  letter-spacing: 0;
}

.booking-summary dl {
  display: grid;
  gap: 0.75rem;
  margin: 0;
}

.booking-summary dl div {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  border-bottom: 1px solid rgba(223, 208, 195, 0.72);
  padding-bottom: 0.65rem;
}

.booking-summary dt {
  color: var(--color-muted);
}

.booking-summary dd {
  margin: 0;
  color: var(--color-ink);
  font-weight: 700;
  text-align: right;
}

.shop-summary {
  display: grid;
  gap: 0.25rem;
  margin-top: 1rem;
  color: var(--color-muted);
  font-size: 0.9rem;
}

.shop-summary strong {
  color: var(--color-ink);
}

.form-success,
.form-error {
  border-radius: var(--radius-card);
  padding: 1rem;
  font-size: 0.95rem;
}

.form-success {
  color: var(--color-success);
  background: #edf7ef;
  border: 1px solid #c9e5cf;
}

.form-error {
  color: var(--color-danger);
  background: #fbebe8;
  border: 1px solid #efcac5;
  margin-bottom: 1rem;
}

.form-fields,
.form-section {
  display: grid;
  gap: 1.25rem;
}

.form-section {
  border-bottom: 1px solid rgba(223, 208, 195, 0.72);
  padding-bottom: 1.25rem;
}

.section-heading {
  display: flex;
  gap: 0.8rem;
  align-items: flex-start;
}

.section-heading > span {
  width: 2rem;
  height: 2rem;
  border-radius: 999px;
  display: inline-grid;
  place-items: center;
  flex: 0 0 auto;
  background: var(--color-bg-strong);
  color: var(--color-primary);
  font-weight: 800;
}

.section-heading h2 {
  margin: 0.15rem 0 0;
  font-size: 1.25rem;
  line-height: 1.2;
}

.service-picker-controls {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 0.75rem;
  align-items: end;
}

.service-search {
  min-width: 0;
}

.service-result-count {
  color: var(--color-muted);
  font-size: 0.85rem;
  font-weight: 700;
  padding-bottom: 0.9rem;
  white-space: nowrap;
}

.service-options {
  max-height: 22rem;
  overflow: auto;
  display: grid;
  gap: 0.45rem;
  padding-right: 0.35rem;
}

.service-option {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  gap: 0.7rem;
  align-items: center;
  border: 1px solid var(--color-border);
  border-radius: 0.75rem;
  background: var(--color-surface-strong);
  padding: 0.65rem 0.75rem;
  cursor: pointer;
}

.service-option.selected {
  border-color: var(--color-primary);
  box-shadow: inset 3px 0 0 var(--color-primary), 0 0 0 3px rgba(125, 78, 63, 0.1);
}

.service-option input {
  width: 1rem;
  height: 1rem;
  accent-color: var(--color-primary);
}

.service-option-copy {
  min-width: 0;
  display: grid;
  gap: 0.1rem;
}

.service-option-copy strong {
  overflow: hidden;
  color: var(--color-ink);
  font-size: 0.95rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.service-option-copy small {
  display: -webkit-box;
  overflow: hidden;
  color: var(--color-muted);
  font-size: 0.82rem;
  line-height: 1.35;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.service-option-meta {
  display: grid;
  gap: 0.05rem;
  justify-items: end;
  min-width: max-content;
  color: var(--color-muted);
}

.service-option-meta span {
  font-size: 0.78rem;
  font-weight: 700;
}

.service-option-meta strong {
  color: var(--color-ink-soft);
  font-size: 0.95rem;
}

.service-empty-state {
  border: 1px dashed var(--color-border);
  border-radius: var(--radius-card);
  margin: 0;
  padding: 1rem;
  color: var(--color-muted);
  text-align: center;
}

.field-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.9rem;
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

.submit-btn {
  justify-self: start;
}

@media (max-width: 860px) {
  .booking-layout {
    grid-template-columns: 1fr;
  }

  .booking-summary {
    position: static;
    order: 2;
  }
}

@media (max-width: 560px) {
  .field-grid {
    grid-template-columns: 1fr;
  }

  .service-picker-controls {
    grid-template-columns: 1fr;
    align-items: stretch;
  }

  .service-result-count {
    padding-bottom: 0;
  }

  .service-options {
    max-height: 20rem;
  }

  .service-option {
    grid-template-columns: auto minmax(0, 1fr);
    align-items: start;
  }

  .service-option input {
    margin-top: 0.15rem;
  }

  .service-option-meta {
    grid-column: 2;
    grid-template-columns: repeat(2, max-content);
    justify-content: start;
    justify-items: start;
    column-gap: 0.55rem;
  }

  .submit-btn {
    width: 100%;
  }
}
</style>
