<template>
  <AdminShell>
    <h1 class="page-heading">Overview</h1>
    <div class="overview-cards">
      <div class="stat-card">
        <div class="stat-value">{{ stats.bookings ?? '-' }}</div>
        <div class="stat-label">Total Bookings</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">{{ stats.services ?? '-' }}</div>
        <div class="stat-label">Services</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">{{ stats.staff ?? '-' }}</div>
        <div class="stat-label">Staff</div>
      </div>
    </div>
  </AdminShell>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: 'admin-auth',
  layout: false
})

const config = useRuntimeConfig()
const baseUrl = config.public.apiBaseUrl

const stats = reactive<{ bookings?: number; services?: number; staff?: number }>({})

try {
  const [bookings, services, staff] = await Promise.all([
    $fetch<unknown[]>(`${baseUrl}/admin/bookings`, { credentials: 'include' }).catch(() => []),
    $fetch<unknown[]>(`${baseUrl}/admin/services`, { credentials: 'include' }).catch(() => []),
    $fetch<unknown[]>(`${baseUrl}/admin/staff`, { credentials: 'include' }).catch(() => [])
  ])
  stats.bookings = bookings.length
  stats.services = services.length
  stats.staff = staff.length
} catch {
  // Stats will show '-'
}
</script>

<style scoped>
.page-heading {
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0 0 1.5rem;
}

.overview-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 1rem;
}

.stat-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-card);
  padding: 1.5rem;
}

.stat-value {
  font-size: 2rem;
  font-weight: 700;
  color: var(--color-primary);
}

.stat-label {
  font-size: 0.85rem;
  color: var(--color-muted);
  margin-top: 0.25rem;
}
</style>
