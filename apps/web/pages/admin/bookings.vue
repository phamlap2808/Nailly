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
              <div class="booking-actions">
                <span v-if="!getBookingDropdownActions(b).length" class="booking-no-action">No action</span>

                <div
                  v-if="getBookingDropdownActions(b).length"
                  class="booking-more-menu"
                  :class="{ 'booking-more-menu--open': isBookingMenuOpen(b.id) }"
                >
                  <button
                    class="booking-more-trigger"
                    type="button"
                    aria-label="More booking actions"
                    :aria-expanded="isBookingMenuOpen(b.id)"
                    @click="toggleBookingMenu(b.id)"
                  >
                    <Icon name="lucide:more-horizontal" aria-hidden="true" />
                  </button>
                  <div v-if="isBookingMenuOpen(b.id)" class="booking-menu-list">
                    <NuxtLink
                      v-for="action in getBookingDropdownActions(b).filter((item) => item.to)"
                      :key="action.label"
                      class="booking-menu-action booking-menu-link"
                      :to="action.to"
                      @click="closeBookingMenu"
                    >
                      <Icon v-if="action.icon" :name="action.icon" aria-hidden="true" />
                      {{ action.label }}
                    </NuxtLink>
                    <button
                      v-for="action in getBookingDropdownActions(b).filter((item) => item.status)"
                      :key="action.label"
                      class="booking-menu-action"
                      :class="{ 'booking-menu-action--danger': action.tone === 'danger' }"
                      type="button"
                      @click="handleDropdownStatusAction(b.id, action.status)"
                    >
                      <Icon v-if="action.icon" :name="action.icon" aria-hidden="true" />
                      {{ action.label }}
                    </button>
                  </div>
                </div>
              </div>
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
          <div class="booking-actions">
            <span v-if="!getBookingDropdownActions(b).length" class="booking-no-action">No action</span>

            <div
              v-if="getBookingDropdownActions(b).length"
              class="booking-more-menu"
              :class="{ 'booking-more-menu--open': isBookingMenuOpen(b.id) }"
            >
              <button
                class="booking-more-trigger"
                type="button"
                aria-label="More booking actions"
                :aria-expanded="isBookingMenuOpen(b.id)"
                @click="toggleBookingMenu(b.id)"
              >
                <Icon name="lucide:more-horizontal" aria-hidden="true" />
              </button>
              <div v-if="isBookingMenuOpen(b.id)" class="booking-menu-list">
                <NuxtLink
                  v-for="action in getBookingDropdownActions(b).filter((item) => item.to)"
                  :key="action.label"
                  class="booking-menu-action booking-menu-link"
                  :to="action.to"
                  @click="closeBookingMenu"
                >
                  <Icon v-if="action.icon" :name="action.icon" aria-hidden="true" />
                  {{ action.label }}
                </NuxtLink>
                <button
                  v-for="action in getBookingDropdownActions(b).filter((item) => item.status)"
                  :key="action.label"
                  class="booking-menu-action"
                  :class="{ 'booking-menu-action--danger': action.tone === 'danger' }"
                  type="button"
                  @click="handleDropdownStatusAction(b.id, action.status)"
                >
                  <Icon v-if="action.icon" :name="action.icon" aria-hidden="true" />
                  {{ action.label }}
                </button>
              </div>
            </div>
          </div>
        </article>
      </div>
    </div>
  </AdminShell>
</template>

<script setup lang="ts">
import { getBookingStatusDisplay } from '../../utils/admin-status'
import { resolveRuntimeApiBaseUrl } from '../../utils/api-url'

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
  status: BookingStatus
}

type BookingStatus = 'pending_confirmation' | 'confirmed' | 'completed' | 'cancelled'

interface BookingDropdownAction {
  label: string
  icon?: string
  status?: BookingStatus
  tone?: 'danger'
  to?: string
}

const config = useRuntimeConfig()
const baseUrl = resolveRuntimeApiBaseUrl(config, import.meta.server)
const requestHeaders = import.meta.server ? useRequestHeaders(['cookie']) : undefined

const bookings = ref<AdminBooking[]>([])
const loading = ref(true)
const statusFilter = ref('')
const openBookingMenuId = ref<string | null>(null)

watchEffect(async () => {
  loading.value = true
  try {
    const params = statusFilter.value ? `?status=${statusFilter.value}` : ''
    bookings.value = await $fetch<AdminBooking[]>(`${baseUrl}/admin/bookings${params}`, {
      credentials: 'include',
      headers: requestHeaders
    })
  } finally {
    loading.value = false
  }
})

function getBookingDropdownActions(booking: AdminBooking): BookingDropdownAction[] {
  if (booking.status === 'pending_confirmation') {
    return [
      { label: 'Confirm', icon: 'lucide:check', status: 'confirmed' },
      { label: 'Cancel booking', status: 'cancelled', tone: 'danger' }
    ]
  }

  if (booking.status === 'confirmed') {
    return [
      { label: 'Checkout', icon: 'lucide:credit-card', to: `/admin/pos?bookingId=${booking.id}` },
      { label: 'Mark completed', status: 'completed' },
      { label: 'Cancel booking', status: 'cancelled', tone: 'danger' }
    ]
  }

  if (booking.status === 'completed') {
    return [{ label: 'Checkout', icon: 'lucide:credit-card', to: `/admin/pos?bookingId=${booking.id}` }]
  }

  return []
}

function isBookingMenuOpen(id: string) {
  return openBookingMenuId.value === id
}

function toggleBookingMenu(id: string) {
  openBookingMenuId.value = isBookingMenuOpen(id) ? null : id
}

function closeBookingMenu() {
  openBookingMenuId.value = null
}

async function handleDropdownStatusAction(id: string, status?: BookingStatus) {
  if (!status) return
  closeBookingMenu()
  await handleStatusChange(id, status)
}

async function handleStatusChange(id: string, status: BookingStatus) {
  if (!status) return
  await $fetch(`${baseUrl}/admin/bookings/${id}/status`, {
    method: 'PATCH',
    credentials: 'include',
    headers: requestHeaders,
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
  overflow: visible;
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

.data-table th:last-child,
.data-table td:last-child {
  text-align: right;
}

.data-table td:last-child {
  width: 7rem;
}

.booking-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.5rem;
  flex-wrap: wrap;
  position: relative;
}

.booking-no-action {
  color: var(--color-muted);
  font-size: 0.84rem;
  font-weight: 800;
}

.booking-more-menu {
  position: relative;
}

.booking-more-trigger {
  width: 2.35rem;
  height: 2.35rem;
  display: inline-grid;
  place-items: center;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-card);
  background: var(--color-surface-strong);
  color: var(--color-primary);
  cursor: pointer;
  list-style: none;
}

.booking-more-menu--open .booking-more-trigger {
  border-color: var(--color-primary);
  background: #f7ebe4;
}

.booking-menu-list {
  min-width: 11rem;
  position: absolute;
  top: calc(100% + 0.35rem);
  right: 0;
  z-index: 30;
  display: grid;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-card);
  background: #fff;
  box-shadow: 0 18px 40px rgba(72, 49, 39, 0.14);
  overflow: hidden;
}

.booking-menu-action {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  border: 0;
  background: transparent;
  color: var(--color-ink);
  font: inherit;
  font-weight: 800;
  padding: 0.7rem 0.85rem;
  text-align: left;
  text-decoration: none;
}

.booking-menu-action:hover {
  background: var(--color-bg-strong);
}

.booking-menu-action--danger {
  color: #934638;
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

  .booking-actions {
    justify-content: flex-start;
  }

  .booking-menu-list {
    right: auto;
    left: 0;
  }
}
</style>
