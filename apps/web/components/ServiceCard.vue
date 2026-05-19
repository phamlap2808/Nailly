<template>
  <article class="service-card">
    <div class="service-copy">
      <h3>{{ service.name }}</h3>
      <p>{{ service.description }}</p>
    </div>
    <div class="service-details" aria-label="Service details">
      <span>{{ service.durationMinutes }} min</span>
      <strong>{{ formatPrice(service.priceCents) }}</strong>
    </div>
  </article>
</template>

<script setup lang="ts">
import { formatPrice } from '../utils/format'

defineProps<{
  service: {
    name: string
    description: string
    durationMinutes: number
    priceCents: number
  }
}>()
</script>

<style scoped>
.service-card {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(8rem, auto);
  align-items: start;
  gap: 1rem;
  padding: 1.3rem 0;
  border-top: 1px solid rgba(223, 208, 195, 0.82);
}

.service-card:last-child {
  border-bottom: 1px solid rgba(223, 208, 195, 0.82);
}

.service-copy {
  min-width: 0;
}

.service-copy h3 {
  margin: 0 0 0.35rem;
  color: var(--color-ink);
  font-size: 1rem;
  font-weight: 900;
  letter-spacing: 0.02em;
  line-height: 1.18;
  text-transform: uppercase;
}

.service-copy p {
  max-width: 45rem;
  margin: 0;
  color: var(--color-muted);
  font-size: 0.95rem;
  line-height: 1.62;
}

.service-details {
  display: grid;
  justify-items: end;
  gap: 0.35rem;
  color: var(--color-muted);
  font-size: 0.9rem;
  line-height: 1.2;
}

.service-details strong {
  color: var(--color-primary);
  font-size: 1.08rem;
}

@media (max-width: 640px) {
  .service-card {
    grid-template-columns: 1fr;
    gap: 0.75rem;
  }

  .service-details {
    display: flex;
    align-items: center;
    justify-content: space-between;
    justify-items: stretch;
  }
}
</style>
