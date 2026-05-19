<template>
  <AdminShell>
    <div class="admin-page-header">
      <div>
        <p class="eyebrow">Dashboard</p>
        <h1 class="display-title">Overview</h1>
        <p>Quick read on booking volume and the catalog powering the public site.</p>
      </div>
    </div>

    <div class="overview-cards">
      <div class="stat-card surface-panel">
        <span>Total bookings</span>
        <strong>{{ stats.bookings ?? '-' }}</strong>
      </div>
      <div class="stat-card surface-panel">
        <span>Services</span>
        <strong>{{ stats.services ?? '-' }}</strong>
      </div>
      <div class="stat-card surface-panel">
        <span>Staff</span>
        <strong>{{ stats.staff ?? '-' }}</strong>
      </div>
    </div>
  </AdminShell>
</template>

<script setup lang="ts">
import { resolveRuntimeApiBaseUrl } from '../../utils/api-url'

definePageMeta({
  middleware: 'admin-auth',
  layout: false
})

const config = useRuntimeConfig()
const baseUrl = resolveRuntimeApiBaseUrl(config, import.meta.server)
const requestHeaders = import.meta.server ? useRequestHeaders(['cookie']) : undefined

const stats = reactive<{ bookings?: number; services?: number; staff?: number }>({})

try {
  const [bookings, services, staff] = await Promise.all([
    $fetch<unknown[]>(`${baseUrl}/admin/bookings`, { credentials: 'include', headers: requestHeaders }).catch(() => []),
    $fetch<unknown[]>(`${baseUrl}/admin/services`, { credentials: 'include', headers: requestHeaders }).catch(() => []),
    $fetch<unknown[]>(`${baseUrl}/admin/staff`, { credentials: 'include', headers: requestHeaders }).catch(() => [])
  ])
  stats.bookings = bookings.length
  stats.services = services.length
  stats.staff = staff.length
} catch {
  // Stats will show '-'
}
</script>

<style scoped>
.admin-page-header {
  display: flex;
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

.overview-cards {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1rem;
}

.stat-card {
  padding: 1.25rem;
}

.stat-card span {
  color: var(--color-muted);
  font-size: 0.78rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.stat-card strong {
  display: block;
  margin-top: 0.75rem;
  color: var(--color-primary);
  font-size: 2.4rem;
  line-height: 1;
}

@media (max-width: 760px) {
  .overview-cards {
    grid-template-columns: 1fr;
  }
}
</style>
