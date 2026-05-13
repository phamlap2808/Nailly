<template>
  <div>
    <PublicNav />
    <main class="container booking-page">
      <h1 class="page-heading">{{ $t('booking.title') }}</h1>

      <div v-if="!site" class="loading-state">Loading...</div>

      <div v-else class="booking-layout">
        <BookingForm
          :services="site.services ?? []"
          :staff="site.staff ?? []"
        />

        <!-- Shop summary sidebar -->
        <aside class="booking-sidebar">
          <div class="sidebar-card">
            <h2>{{ site.shop?.name }}</h2>
            <p v-if="site.shop?.address">{{ site.shop.address }}</p>
            <p v-if="site.shop?.phone">{{ site.shop.phone }}</p>
          </div>
        </aside>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
const config = useRuntimeConfig()
const { data: site } = await useFetch<{
  shop: { name: string; address: string; phone: string } | null
  services: Array<{ id: string; name: string; durationMins: number; priceCents: number }>
  staff: Array<{ id: string; name: string }>
}>(`${config.public.apiBaseUrl}/public/site`)

useSeoMeta({
  title: 'Book an Appointment',
  description: 'Schedule your next nail appointment at Luma Nail Studio.'
})
</script>

<style scoped>
.booking-page {
  padding: 3rem 0;
}

.page-heading {
  font-size: 1.75rem;
  font-weight: 700;
  margin: 0 0 2rem;
}

.booking-layout {
  display: grid;
  grid-template-columns: 1fr 280px;
  gap: 3rem;
  align-items: start;
}

@media (max-width: 768px) {
  .booking-layout {
    grid-template-columns: 1fr;
    gap: 2rem;
  }
}

.booking-sidebar {
  position: sticky;
  top: 5rem;
}

.sidebar-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-card);
  padding: 1.5rem;
}

.sidebar-card h2 {
  font-size: 1.1rem;
  font-weight: 600;
  margin: 0 0 0.75rem;
}

.sidebar-card p {
  color: var(--color-muted);
  font-size: 0.9rem;
  margin: 0.25rem 0;
}

.loading-state {
  color: var(--color-muted);
  text-align: center;
  padding: 3rem;
}
</style>
