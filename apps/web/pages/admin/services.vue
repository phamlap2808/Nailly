<template>
  <AdminShell>
    <div class="admin-page-header">
      <div>
        <p class="eyebrow">Catalog</p>
        <h1 class="display-title">Services</h1>
        <p>Keep service names, timing, pricing, and availability ready for public booking.</p>
      </div>
      <button class="btn-primary" @click="openCreate">Add service</button>
    </div>

    <div v-if="loading" class="loading-state surface-panel">Loading services...</div>

    <template v-else>
      <div v-for="cat in categories" :key="cat.id" class="category-panel surface-panel">
        <h2 class="category-name">{{ cat.name }}</h2>
        <div class="service-list">
          <div v-for="svc in getServicesForCategory(cat.id)" :key="svc.id" class="service-row">
            <div>
              <div class="service-name">{{ svc.name }}</div>
              <div class="service-meta">{{ svc.durationMinutes }} min / {{ formatPrice(svc.priceCents) }}</div>
            </div>
            <div class="service-actions">
              <span :class="['active-dot', svc.active ? 'on' : 'off']" />
              <button class="btn-secondary action-btn" @click="openEdit(svc)">Edit</button>
            </div>
          </div>
        </div>
      </div>
    </template>

    <dialog v-if="showModal" class="modal-overlay" @click.self="showModal = false">
      <form class="modal-card" @submit.prevent="handleSave">
        <h2>{{ editing ? 'Edit Service' : 'New Service' }}</h2>
        <label class="field">
          <span>Name</span>
          <input v-model="form.name" class="form-control" required />
        </label>
        <label class="field">
          <span>Description</span>
          <textarea v-model="form.description" class="form-control" rows="2" required />
        </label>
        <label class="field">
          <span>Category</span>
          <select v-model="form.categoryId" class="form-control">
            <option v-for="cat in categories" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
          </select>
        </label>
        <div class="field-row">
          <label class="field field-short">
            <span>Duration (min)</span>
            <input v-model.number="form.durationMinutes" class="form-control" type="number" required min="15" step="15" />
          </label>
          <label class="field field-short">
            <span>Price (cents)</span>
            <input v-model.number="form.priceCents" class="form-control" type="number" required min="0" />
          </label>
        </div>
        <label class="field checkbox-field">
          <input v-model="form.active" type="checkbox" />
          <span>Active</span>
        </label>
        <div class="modal-actions">
          <button type="button" class="btn-secondary" @click="showModal = false">Cancel</button>
          <button type="submit" class="btn-primary">{{ editing ? 'Update' : 'Create' }}</button>
        </div>
      </form>
    </dialog>
  </AdminShell>
</template>

<script setup lang="ts">
import { formatPrice } from '../../utils/format'

definePageMeta({
  middleware: 'admin-auth',
  layout: false
})

interface ServiceCategory {
  id: string
  name: string
}

interface AdminService {
  id: string
  categoryId: string
  name: string
  description: string
  durationMinutes: number
  priceCents: number
  active: boolean
}

const config = useRuntimeConfig()
const baseUrl = config.public.apiBaseUrl

const categories = ref<ServiceCategory[]>([])
const services = ref<AdminService[]>([])
const loading = ref(true)
const showModal = ref(false)
const editing = ref<AdminService | null>(null)

const form = reactive({
  name: '',
  description: '',
  categoryId: '',
  durationMinutes: 30,
  priceCents: 0,
  active: true
})

function getServicesForCategory(catId: string) {
  return services.value.filter((s) => s.categoryId === catId)
}

async function fetchData() {
  loading.value = true
  const [cats, svcs] = await Promise.all([
    $fetch<ServiceCategory[]>(`${baseUrl}/admin/service-categories`, { credentials: 'include' }),
    $fetch<AdminService[]>(`${baseUrl}/admin/services`, { credentials: 'include' })
  ])
  categories.value = cats
  services.value = svcs
  loading.value = false
}

await fetchData()

function openCreate() {
  editing.value = null
  form.name = ''
  form.description = ''
  form.categoryId = categories.value[0]?.id ?? ''
  form.durationMinutes = 30
  form.priceCents = 0
  form.active = true
  showModal.value = true
}

function openEdit(svc: AdminService) {
  editing.value = svc
  form.name = svc.name
  form.description = svc.description
  form.categoryId = svc.categoryId
  form.durationMinutes = svc.durationMinutes
  form.priceCents = svc.priceCents
  form.active = svc.active
  showModal.value = true
}

async function handleSave() {
  const payload = { ...form }
  if (editing.value) {
    await $fetch(`${baseUrl}/admin/services/${editing.value.id}`, {
      method: 'PATCH',
      credentials: 'include',
      body: payload
    })
  } else {
    await $fetch(`${baseUrl}/admin/services`, {
      method: 'POST',
      credentials: 'include',
      body: payload
    })
  }
  showModal.value = false
  await fetchData()
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

.category-panel {
  padding: 1rem;
  margin-bottom: 1rem;
}

.category-name {
  color: var(--color-muted);
  font-size: 0.78rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  margin: 0 0 0.75rem;
}

.service-list {
  display: grid;
}

.service-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 1rem;
  align-items: center;
  border-top: 1px solid var(--color-border);
  padding: 0.9rem 0;
}

.service-row:first-child {
  border-top: none;
}

.service-name {
  font-weight: 800;
}

.service-meta {
  color: var(--color-muted);
  font-size: 0.85rem;
}

.service-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.active-dot {
  width: 0.55rem;
  height: 0.55rem;
  border-radius: 999px;
  background: var(--color-border);
}

.active-dot.on {
  background: var(--color-success);
}

.action-btn {
  min-height: 2rem;
  padding: 0.35rem 0.7rem;
}

.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: rgba(43, 33, 29, 0.36);
  padding: 1rem;
}

.modal-card {
  width: min(100%, 520px);
  max-height: 90vh;
  overflow-y: auto;
  border-radius: var(--radius-card);
  background: var(--color-surface);
  padding: 1.5rem;
}

.modal-card h2 {
  margin: 0 0 1.25rem;
  font-size: 1.2rem;
}

.field {
  display: grid;
  gap: 0.35rem;
  margin-bottom: 1rem;
}

.field span,
.field legend {
  color: var(--color-ink-soft);
  font-size: 0.85rem;
  font-weight: 700;
}

.field-short {
  min-width: 140px;
}

.field-row {
  display: flex;
  gap: 1rem;
}

.checkbox-field {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 1rem;
}

.loading-state {
  color: var(--color-muted);
  padding: 2rem;
}

@media (max-width: 640px) {
  .admin-page-header,
  .service-row {
    display: grid;
    grid-template-columns: 1fr;
  }

  .field-row {
    display: grid;
  }

  .modal-actions {
    display: grid;
  }
}
</style>
