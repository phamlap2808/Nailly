<template>
  <AdminShell>
    <div class="page-header">
      <h1 class="page-heading">Bookings</h1>
      <select v-model="statusFilter" class="filter-select">
        <option value="">All</option>
        <option value="pending_confirmation">Pending</option>
        <option value="confirmed">Confirmed</option>
        <option value="completed">Completed</option>
        <option value="cancelled">Cancelled</option>
      </select>
    </div>

    <div v-if="loading" class="loading-state">Loading...</div>

    <div v-else-if="!bookings.length" class="empty-state">No bookings found.</div>

    <table v-else class="data-table">
      <thead>
        <tr>
          <th>Customer</th>
          <th>Date</th>
          <th>Time</th>
          <th>Status</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="b in bookings" :key="b.id">
          <td>{{ b.customerName }}</td>
          <td>{{ b.appointmentDate }}</td>
          <td>{{ b.startTime }}</td>
          <td><span :class="['status-badge', b.status]">{{ b.status }}</span></td>
          <td>
            <select
              v-if="b.status === 'pending_confirmation' || b.status === 'confirmed'"
              class="status-action"
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
  </AdminShell>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: 'admin-auth',
  layout: false
})

const config = useRuntimeConfig()
const baseUrl = config.public.apiBaseUrl

const bookings = ref<any[]>([])
const loading = ref(true)
const statusFilter = ref('')

watchEffect(async () => {
  loading.value = true
  try {
    const params = statusFilter.value ? `?status=${statusFilter.value}` : ''
    bookings.value = await $fetch(`${baseUrl}/admin/bookings${params}`, { credentials: 'include' })
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
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.page-heading {
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0;
}

.filter-select {
  padding: 0.4rem 0.75rem;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  font-size: 0.85rem;
  background: var(--color-surface);
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-card);
  overflow: hidden;
}

.data-table th,
.data-table td {
  padding: 0.7rem 1rem;
  text-align: left;
  font-size: 0.9rem;
  border-bottom: 1px solid var(--color-border);
}

.data-table th {
  font-weight: 600;
  background: #fafaf9;
  color: var(--color-muted);
  font-size: 0.8rem;
  text-transform: uppercase;
}

.status-badge {
  display: inline-block;
  padding: 0.15rem 0.5rem;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 500;
  background: #f0f4ff;
  color: var(--color-primary);
}

.status-badge.confirmed {
  background: #f0fdf4;
  color: #16a34a;
}

.status-badge.completed {
  background: #f5f5f4;
  color: var(--color-muted);
}

.status-badge.cancelled {
  background: #fef2f2;
  color: #dc2626;
}

.status-action {
  padding: 0.25rem;
  border: 1px solid var(--color-border);
  border-radius: 4px;
  font-size: 0.8rem;
  background: var(--color-surface);
}

.loading-state,
.empty-state {
  color: var(--color-muted);
  text-align: center;
  padding: 3rem;
}

@media (max-width: 768px) {
  .data-table {
    font-size: 0.8rem;
  }
  .data-table th,
  .data-table td {
    padding: 0.5rem 0.5rem;
  }
}
</style>
