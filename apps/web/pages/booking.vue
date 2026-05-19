<template>
  <div>
    <PublicNav :shop-name="site?.shop?.name" />
    <main class="booking-page">
      <section class="booking-campaign">
        <img
          v-if="bookingImage"
          :src="bookingImage.url"
          :alt="bookingImage.altText ?? 'Nail appointment detail'"
          class="booking-campaign-image"
          width="1680"
          height="720"
          fetchpriority="high"
        />
        <div v-else class="booking-campaign-image booking-campaign-image--fallback" aria-hidden="true" />
        <div class="booking-campaign-overlay" aria-hidden="true" />

        <div class="container booking-campaign-copy">
          <p class="eyebrow">Appointments</p>
          <h1 class="display-title">{{ $t('booking.title') }}</h1>
          <p>Choose your treatment, find a time, and send a request. The salon will contact you to confirm.</p>
        </div>
      </section>

      <section class="container booking-client-shell">
        <div class="booking-note-bar">
          <span>Online request</span>
          <strong>{{ site?.shop?.phone ?? 'We will confirm by phone' }}</strong>
        </div>

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
  gallery: Array<{ url: string; altText: string | null }> | null
}>('/public/site', {
  key: 'public-site',
  baseURL: resolveRuntimeApiBaseUrl(config, import.meta.server)
})

const fallbackBookingImage = {
  url: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?auto=format&fit=crop&w=1800&q=80',
  altText: 'Editorial manicure detail'
}

const bookingImage = computed(() => {
  const image = site.value?.gallery?.[0]

  if (!image || image.url.includes('/nailly-media/demo/')) return fallbackBookingImage

  return image
})

useSeoMeta({
  title: 'Book an Appointment',
  description: () => `Schedule your next nail appointment at ${site.value?.shop?.name ?? 'Luma Nail Studio'}.`
})
</script>

<style scoped>
.booking-page {
  min-height: 100vh;
  background: #fffaf7;
}

.booking-campaign {
  position: relative;
  display: grid;
  align-items: end;
  min-height: 25rem;
  overflow: hidden;
  background: var(--color-ink);
}

.booking-campaign-image {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.booking-campaign-image--fallback {
  background: #c89686;
}

.booking-campaign-overlay {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(90deg, rgba(20, 14, 11, 0.76), rgba(20, 14, 11, 0.3)),
    linear-gradient(180deg, rgba(20, 14, 11, 0.06), rgba(20, 14, 11, 0.62));
}

.booking-campaign-copy {
  position: relative;
  z-index: 1;
  padding-top: 6rem;
  padding-bottom: 3.8rem;
  color: #fff;
}

.booking-campaign-copy .eyebrow {
  margin: 0 0 0.85rem;
  color: #f9d9d3;
}

.booking-campaign-copy h1 {
  max-width: 54rem;
  margin: 0;
  font-size: 4.6rem;
  line-height: 0.98;
}

.booking-campaign-copy p:not(.eyebrow) {
  max-width: 40rem;
  margin: 1.2rem 0 0;
  color: rgba(255, 255, 255, 0.88);
  font-size: 1.04rem;
  line-height: 1.72;
}

.booking-client-shell {
  padding-top: 2rem;
  padding-bottom: 5rem;
}

.booking-note-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  border: 1px solid #eadbd2;
  border-bottom: 0;
  background: #f8dcd5;
  padding: 0.9rem 1rem;
}

.booking-note-bar span {
  color: var(--color-primary);
  font-size: 0.72rem;
  font-weight: 900;
  letter-spacing: 0.15em;
  text-transform: uppercase;
}

.booking-note-bar strong {
  color: var(--color-ink);
  font-size: 0.9rem;
}

.loading-state {
  border-radius: 0;
  color: var(--color-muted);
  padding: 2rem;
}

@media (max-width: 640px) {
  .booking-campaign {
    min-height: 24rem;
  }

  .booking-campaign-copy {
    padding-top: 5rem;
    padding-bottom: 3rem;
  }

  .booking-campaign-copy h1 {
    font-size: 3.15rem;
  }

  .booking-note-bar {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
