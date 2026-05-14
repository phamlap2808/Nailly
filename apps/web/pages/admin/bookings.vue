<template>
  <AdminShell>
    <div class="admin-page-header">
      <div>
        <p class="eyebrow">Operations</p>
        <h1 class="display-title">Bookings</h1>
        <p>Review requests, confirm appointments, and keep the salon day tidy.</p>
      </div>
      <select v-model="statusFilter" class="filter-select form-control">
        <option value="">All bookings</option>
        <option value="pending_confirmation">Pending</option>
        <option value="confirmed">Confirmed</option>
        <option value="completed">Completed</option>
        <option value="cancelled">Cancelled</option>
      </select>
    </div>

    <div v-if="loading" class="loading-state surface-panel">Loading bookings...</div>
    <div v-else-if="!bookings.length" class="empty-state surface-panel">No bookings found.</div>

    <div v-else class="bookings-panel surface-panel">
      <table class="data-table">
        <thead>
          <tr>
            <th>Customer</th>
            <th>Date</th>
            <th>Time</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="b in bookings" :key="b.id">
            <td>
              <strong>{{ b.customerName }}</strong>
              <span v-if="b.phone">{{ b.phone }}</span>
            </td>
            <td>{{ b.appointmentDate }}</td>
            <td>{{ b.startTime }}</td>
            <td><span :class="getBookingStatusDisplay(b.status).className">{{ getBookingStatusDisplay(b.status).label }}</span></td>
            <td>
              <select
                v-if="b.status === 'pending_confirmation' || b.status === 'confirmed'"
                class="status-action form-control"
                @change="(e) => handleStatusChange(b.id, (e.target as HTMLSelectElement).value)"
              >
                <option value="">Update...</option>
                <option value="confirmed">Confirm</option>
                <option value="completed">Complete</option>
                <option value="cancelled">Cancel</option>
              </select>
            </td>
          </tr>
        </tbody>
      </table>

      <div class="booking-cards">
        <article v-for="b in bookings" :key="`card-${b.id}`" class="booking-card">
          <div>
            <strong>{{ b.customerName }}</strong>
            <span>{{ b.appointmentDate }} at {{ b.startTime }}</span>
          </div>
          <span :class="getBookingStatusDisplay(b.status).className">{{ getBookingStatusDisplay(b.status).label }}</span>
          <select
            v-if="b.status === 'pending_confirmation' || b.status === 'confirmed'"
            class="status-action form-control"
            @change="(e) => handleStatusChange(b.id, (e.target as HTMLSelectElement).value)"
          >
            <option value="">Update...</option>
            <option value="confirmed">Confirm</option>
            <option value="completed">Complete</option>
            <option value="cancelled">Cancel</option>
          </select>
        </article>
      </div>
    </div>
  </AdminShell>
</template>

<script setup lang="ts">
import { getBookingStatusDisplay } from '../../utils/admin-status'

definePageMeta({
  middleware: 'admin-auth',
  layout: false
})

interface AdminBooking {
  id: string
  customerName: string
  phone: string
  appointmentDate: string
  startTime: string
  status: string
}

const config = useRuntimeConfig()
const baseUrl = config.public.apiBaseUrl

const bookings = ref<AdminBooking[]>([])
const loading = ref(true)
const statusFilter = ref('')

watchEffect(async () => {
  loading.value = true
  try {
    const params = statusFilter.value ? `?status=${statusFilter.value}` : ''
    bookings.value = await $fetch<AdminBooking[]>(`${baseUrl}/admin/bookings${params}`, { credentials: 'include' })
  } finally {
    loading.value = false
  }
})

async function handleStatusChange(id: string, status: string) {
  if (!status) return
  await $fetch(`${baseUrl}/admin/bookings/${id}/status`, {
    method: 'PATCH',
    credentials: 'include',
    body: { status }
  })
  const idx = bookings.value.findIndex((b) => b.id === id)
  if (idx !== -1) bookings.value[idx].status = status
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

.filter-select {
  max-width: 210px;
}

.bookings-panel {
  overflow: hidden;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
}

.data-table th,
.data-table td {
  border-bottom: 1px solid var(--color-border);
  padding: 0.85rem 1rem;
  text-align: left;
  vertical-align: middle;
}

.data-table th {
  background: rgba(239, 226, 214, 0.55);
  color: var(--color-muted);
  font-size: 0.75rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.data-table td strong,
.data-table td span {
  display: block;
}

.data-table td span:not(.status-badge) {
  color: var(--color-muted);
  font-size: 0.82rem;
}

.data-table .status-badge {
  display: inline-flex;
}

.status-action {
  min-height: 2.25rem;
  padding: 0.4rem 0.55rem;
}

.booking-cards {
  display: none;
}

.loading-state,
.empty-state {
  padding: 2rem;
  color: var(--color-muted);
}

@media (max-width: 760px) {
  .admin-page-header {
    display: grid;
  }

  .filter-select {
    max-width: none;
  }

  .data-table {
    display: none;
  }

  .booking-cards {
    display: grid;
    gap: 0.75rem;
    padding: 0.75rem;
  }

  .booking-card {
    display: grid;
    gap: 0.75rem;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-card);
    background: var(--color-surface-strong);
    padding: 1rem;
  }

  .booking-card strong,
  .booking-card span {
    display: block;
  }

  .booking-card .status-badge {
    display: inline-flex;
    justify-self: start;
  }

  .booking-card div > span {
    color: var(--color-muted);
  }
}
</style>
