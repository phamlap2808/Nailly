<template>
  <div class="service-card">
    <div class="service-name">{{ service.name }}</div>
    <p class="service-desc">{{ service.description }}</p>
    <div class="service-meta">
      <span>{{ service.durationMins }} min</span>
      <span class="service-price">{{ formatPrice(service.priceCents) }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { formatPrice } from '../utils/format'

defineProps<{
  service: {
    name: string
    description: string
    durationMins: number
    priceCents: number
  }
}>()
</script>

<style scoped>
.service-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-card);
  padding: 1.5rem;
}

.service-name {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--color-ink);
  margin-bottom: 0.25rem;
}

.service-desc {
  color: var(--color-muted);
  font-size: 0.9rem;
  line-height: 1.5;
  margin: 0 0 0.75rem;
}

.service-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 0.85rem;
  color: var(--color-muted);
}

.service-price {
  font-weight: 600;
  color: var(--color-primary);
}
</style>
