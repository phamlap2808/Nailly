<template>
  <AdminShell>
    <section class="forbidden-panel surface-panel">
      <p class="eyebrow">Access</p>
      <h1 class="display-title">Permission required</h1>
      <p>Your account does not have permission to open this admin area.</p>
      <NuxtLink :to="fallbackPath" class="btn-primary">Go to my dashboard</NuxtLink>
    </section>
  </AdminShell>
</template>

<script setup lang="ts">
import { firstAccessibleAdminPath } from '../../utils/admin-permissions'

definePageMeta({
  middleware: 'admin-auth',
  layout: false
})

const session = useSessionStore()
const fallbackPath = computed(() => firstAccessibleAdminPath(session.user?.permissions))
</script>

<style scoped>
.forbidden-panel {
  display: grid;
  gap: 1rem;
  max-width: 42rem;
  padding: 2rem;
}

.forbidden-panel h1,
.forbidden-panel p {
  margin: 0;
}

.forbidden-panel p:not(.eyebrow) {
  color: var(--color-muted);
}
</style>
