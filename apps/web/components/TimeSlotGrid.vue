<template>
  <div class="slot-grid" aria-live="polite">
    <div v-if="loading" class="slot-state">Loading available times...</div>
    <template v-else>
      <button
        v-for="slot in slots"
        :key="slot"
        type="button"
        :class="['slot-chip', { selected: modelValue === slot, unavailable: unavailableSlots.has(slot) }]"
        :disabled="unavailableSlots.has(slot)"
        @click="$emit('update:modelValue', slot)"
      >
        {{ slot }}
      </button>
      <div v-if="!slots.length" class="slot-state">No time slots available for this date.</div>
    </template>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  modelValue: string | null
  slots: string[]
  unavailableSlots: Set<string>
  loading: boolean
}>()

defineEmits<{
  'update:modelValue': [value: string]
}>()
</script>

<style scoped>
.slot-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(88px, 1fr));
  gap: 0.55rem;
}

.slot-chip {
  min-height: 2.6rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-card);
  background: var(--color-surface-strong);
  color: var(--color-ink);
  font-size: 0.9rem;
  font-weight: 700;
  cursor: pointer;
  transition: border-color 0.15s ease, color 0.15s ease, background 0.15s ease;
}

.slot-chip:hover:not(:disabled) {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.slot-chip.selected {
  background: var(--color-primary);
  color: #fff;
  border-color: var(--color-primary);
}

.slot-chip.unavailable {
  opacity: 0.35;
  cursor: not-allowed;
  text-decoration: line-through;
}

.slot-state {
  grid-column: 1 / -1;
  border: 1px dashed var(--color-border);
  border-radius: var(--radius-card);
  color: var(--color-muted);
  font-size: 0.9rem;
  padding: 0.9rem;
}

@media (max-width: 520px) {
  .slot-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
