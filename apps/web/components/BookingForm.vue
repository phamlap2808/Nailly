<template>
  <form class="booking-form" @submit.prevent="handleSubmit">
    <!-- Success -->
    <div v-if="success" class="form-success">{{ $t('booking.success') }}</div>

    <!-- Error -->
    <div v-if="error" class="form-error">{{ error }}</div>

    <div v-if="!success" class="form-fields">
      <!-- Customer name -->
      <label class="field">
        <span>Name *</span>
        <input v-model="form.customerName" type="text" required placeholder="Your full name" />
      </label>

      <!-- Phone -->
      <label class="field">
        <span>Phone *</span>
        <input v-model="form.phone" type="tel" required placeholder="+1 555 0100" />
      </label>

      <!-- Email (optional) -->
      <label class="field">
        <span>Email</span>
        <input v-model="form.email" type="email" placeholder="Optional" />
      </label>

      <!-- Party size -->
      <label class="field field-short">
        <span>Party size</span>
        <select v-model.number="form.partySize">
          <option v-for="n in 6" :key="n" :value="n">{{ n }}</option>
        </select>
      </label>

      <!-- Services -->
      <fieldset class="field">
        <legend>Services *</legend>
        <label v-for="svc in services" :key="svc.id" class="checkbox-label">
          <input
            type="checkbox"
            :value="svc.id"
            :checked="form.serviceIds.includes(svc.id)"
            @change="toggleService(svc.id)"
          />
          <span>{{ svc.name }} — {{ svc.durationMins }} min / {{ formatPrice(svc.priceCents) }}</span>
        </label>
      </fieldset>

      <!-- Staff (optional) -->
      <label class="field field-short">
        <span>Preferred staff</span>
        <select v-model="form.staffId">
          <option :value="null">Any available</option>
          <option v-for="s in staff" :key="s.id" :value="s.id">{{ s.name }}</option>
        </select>
      </label>

      <!-- Date -->
      <label class="field field-short">
        <span>Date *</span>
        <input v-model="form.appointmentDate" type="date" required :min="today" />
      </label>

      <!-- Time slot -->
      <div class="field">
        <span>Time *</span>
        <TimeSlotGrid
          v-model="form.startTime"
          :slots="availableSlots"
          :unavailable-slots="new Set()"
          :loading="loadingSlots"
        />
      </div>

      <!-- Note (optional) -->
      <label class="field">
        <span>Note</span>
        <textarea v-model="form.note" rows="2" placeholder="Any special requests..." />
      </label>

      <!-- Submit -->
      <button type="submit" class="submit-btn" :disabled="submitting">
        {{ submitting ? 'Submitting...' : $t('booking.submit') }}
      </button>
    </div>
  </form>
</template>

<script setup lang="ts">
import { formatPrice } from '../utils/format'
import { buildBookingPayload } from '../utils/booking-payload'
import type { CreateBookingInput } from '@nailly/shared'

const { t } = useI18n()
const config = useRuntimeConfig()
const baseUrl = config.public.apiBaseUrl

const props = defineProps<{
  services: Array<{ id: string; name: string; durationMins: number; priceCents: number }>
  staff: Array<{ id: string; name: string }>
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

const submitting = ref(false)
const success = ref(false)
const error = ref('')

function toggleService(id: string) {
  const idx = form.serviceIds.indexOf(id)
  if (idx === -1) form.serviceIds.push(id)
  else form.serviceIds.splice(idx, 1)
}

// Fetch availability when date or selected services change
const availableSlots = ref<string[]>([])
const loadingSlots = ref(false)

watch(
  () => [form.appointmentDate, form.serviceIds.length, form.staffId] as const,
  async ([date, serviceCount, staffId]) => {
    if (!date || serviceCount === 0) {
      availableSlots.value = []
      form.startTime = null
      return
    }
    loadingSlots.value = true
    try {
      const params = new URLSearchParams({ date, serviceIds: form.serviceIds.join(',') })
      if (staffId) params.set('staffId', staffId)
      const res = await $fetch<{ slots: string[] }>(`${baseUrl}/public/availability?${params}`)
      availableSlots.value = res.slots
      if (!res.slots.includes(form.startTime ?? '')) {
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
  submitting.value = true
  try {
    const payload = buildBookingPayload({
      ...form,
      startTime: form.startTime ?? '',
      staffId: form.staffId
    } as CreateBookingInput)

    await $fetch(`${baseUrl}/public/bookings`, {
      method: 'POST',
      body: payload
    })
    success.value = true
  } catch (e: any) {
    error.value = e?.data?.error?.message ?? 'Something went wrong. Please try again.'
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.booking-form {
  max-width: 480px;
}

.form-success {
  color: #16a34a;
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  border-radius: var(--radius-card);
  padding: 1.25rem;
  font-size: 0.95rem;
}

.form-error {
  color: #dc2626;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: var(--radius-card);
  padding: 0.75rem 1rem;
  font-size: 0.85rem;
  margin-bottom: 1rem;
}

.form-fields {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.field span, .field legend {
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--color-ink);
}

.field input,
.field select,
.field textarea {
  padding: 0.6rem 0.75rem;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  font-size: 0.9rem;
  font-family: inherit;
  background: var(--color-surface);
  color: var(--color-ink);
}

.field input:focus,
.field select:focus,
.field textarea:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.15);
}

.field-short {
  max-width: 220px;
}

fieldset.field {
  border: none;
  padding: 0;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
  color: var(--color-muted);
  padding: 0.2rem 0;
  cursor: pointer;
}

.submit-btn {
  padding: 0.75rem 1.5rem;
  background: var(--color-primary);
  color: #fff;
  border: none;
  border-radius: var(--radius-card);
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s;
  align-self: flex-start;
}

.submit-btn:hover:not(:disabled) {
  background: var(--color-primary-hover);
}

.submit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
