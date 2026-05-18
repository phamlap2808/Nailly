<template>
  <div>
    <PublicNav />
    <main class="booking-page">
      <section class="container booking-hero">
        <p class="eyebrow">Appointments</p>
        <h1 class="display-title">{{ $t('booking.title') }}</h1>
        <p>Choose your services, find a time, and send a request. The salon will contact you to confirm.</p>
      </section>

      <section class="container booking-content">
        <div v-if="!site" class="loading-state surface-panel">Loading appointment details...</div>
        <BookingForm
          v-else
          :services="site.services ?? []"
          :staff="site.staff ?? []"
          :shop="site.shop"
        />
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
import { resolveRuntimeApiBaseUrl } from '../utils/api-url'

const config = useRuntimeConfig()
const { data: site } = await useFetch<{
  shop: { name: string; address: string; phone: string } | null
  services: Array<{ id: string; name: string; description: string; durationMinutes: number; priceCents: number }>
  staff: Array<{ id: string; name: string }>
}>('/public/site', {
  baseURL: resolveRuntimeApiBaseUrl(config, import.meta.server)
})

useSeoMeta({
  title: 'Book an Appointment',
  description: 'Schedule your next nail appointment at Luma Nail Studio.'
})
</script>

<style scoped>
.booking-page {
  min-height: 100vh;
  background: radial-gradient(circle at top left, rgba(184, 118, 92, 0.16), transparent 34%), var(--color-bg);
}

.booking-hero {
  padding: 3.5rem 1.5rem 1.5rem;
}

.booking-hero h1 {
  margin: 0.4rem 0 0;
  font-size: clamp(2.6rem, 7vw, 5rem);
}

.booking-hero p:not(.eyebrow) {
  max-width: 620px;
  color: var(--color-muted);
  font-size: 1rem;
}

.booking-content {
  padding-bottom: 4rem;
}

.loading-state {
  color: var(--color-muted);
  padding: 2rem;
}
</style>
