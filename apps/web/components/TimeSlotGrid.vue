<template>
  <div class="slot-grid">
    <div v-if="loading" class="slot-loading">Loading available times...</div>
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
      <div v-if="!slots.length && !loading" class="slot-empty">No time slots available for this date.</div>
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
  grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
  gap: 0.5rem;
}

.slot-chip {
  padding: 0.5rem;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  background: var(--color-surface);
  color: var(--color-ink);
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.15s;
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
  opacity: 0.3;
  cursor: not-allowed;
  text-decoration: line-through;
}

.slot-loading,
.slot-empty {
  grid-column: 1 / -1;
  color: var(--color-muted);
  font-size: 0.85rem;
  padding: 0.75rem 0;
}
</style>
