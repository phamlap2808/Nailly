<template>
  <AdminShell>
    <div class="page-header">
      <h1 class="page-heading">Services</h1>
      <button class="btn-primary" @click="openCreate">+ Add Service</button>
    </div>

    <div v-if="loading" class="loading-state">Loading...</div>

    <template v-else>
      <div v-for="cat in categories" :key="cat.id" class="category-group">
        <h2 class="category-name">{{ cat.name }}</h2>
        <div class="service-list">
          <div v-for="svc in getServicesForCategory(cat.id)" :key="svc.id" class="service-row">
            <div>
              <div class="service-name">{{ svc.name }}</div>
              <div class="service-meta">{{ svc.durationMins }} min / {{ formatPrice(svc.priceCents) }}</div>
            </div>
            <div class="service-actions">
              <span :class="['active-dot', svc.isActive ? 'on' : 'off']" />
              <button class="action-btn" @click="openEdit(svc)">Edit</button>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- Create/Edit Modal -->
    <dialog v-if="showModal" class="modal-overlay" @click.self="showModal = false">
      <form class="modal-card" @submit.prevent="handleSave">
        <h2>{{ editing ? 'Edit Service' : 'New Service' }}</h2>
        <label class="field">
          <span>Name</span>
          <input v-model="form.name" required />
        </label>
        <label class="field">
          <span>Description</span>
          <textarea v-model="form.description" rows="2" required />
        </label>
        <label class="field">
          <span>Category</span>
          <select v-model="form.categoryId">
            <option v-for="cat in categories" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
          </select>
        </label>
        <div class="field-row">
          <label class="field field-short">
            <span>Duration (min)</span>
            <input v-model.number="form.durationMins" type="number" required min="15" step="15" />
          </label>
          <label class="field field-short">
            <span>Price (cents)</span>
            <input v-model.number="form.priceCents" type="number" required min="0" />
          </label>
        </div>
        <label class="field checkbox-field">
          <input v-model="form.isActive" type="checkbox" />
          <span>Active</span>
        </label>
        <div class="modal-actions">
          <button type="button" class="btn-cancel" @click="showModal = false">Cancel</button>
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

const config = useRuntimeConfig()
const baseUrl = config.public.apiBaseUrl

const categories = ref<any[]>([])
const services = ref<any[]>([])
const loading = ref(true)
const showModal = ref(false)
const editing = ref<any>(null)

const form = reactive({
  name: '',
  description: '',
  categoryId: '',
  durationMins: 30,
  priceCents: 0,
  isActive: true
})

function getServicesForCategory(catId: string) {
  return services.value.filter((s) => s.categoryId === catId)
}

async function fetchData() {
  loading.value = true
  const [cats, svcs] = await Promise.all([
    $fetch<any[]>(`${baseUrl}/admin/service-categories`, { credentials: 'include' }),
    $fetch<any[]>(`${baseUrl}/admin/services`, { credentials: 'include' })
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
  form.durationMins = 30
  form.priceCents = 0
  form.isActive = true
  showModal.value = true
}

function openEdit(svc: any) {
  editing.value = svc
  form.name = svc.name
  form.description = svc.description
  form.categoryId = svc.categoryId
  form.durationMins = svc.durationMins
  form.priceCents = svc.priceCents
  form.isActive = svc.isActive
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
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.5rem;
}
.page-heading { font-size: 1.5rem; font-weight: 700; margin: 0; }
.btn-primary {
  padding: 0.5rem 1rem;
  background: var(--color-primary);
  color: #fff;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  font-size: 0.85rem;
  cursor: pointer;
}
.category-group { margin-bottom: 2rem; }
.category-name {
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-muted);
  margin: 0 0 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.service-list { display: flex; flex-direction: column; gap: 0.5rem; }
.service-row {
  display: flex; align-items: center; justify-content: space-between;
  background: var(--color-surface); border: 1px solid var(--color-border);
  border-radius: var(--radius-card); padding: 1rem 1.25rem;
}
.service-name { font-weight: 600; font-size: 0.95rem; }
.service-meta { color: var(--color-muted); font-size: 0.8rem; }
.service-actions { display: flex; align-items: center; gap: 0.75rem; }
.active-dot { width: 8px; height: 8px; border-radius: 50%; }
.active-dot.on { background: #16a34a; }
.active-dot.off { background: var(--color-border); }
.action-btn {
  background: none; border: 1px solid var(--color-border); border-radius: 4px;
  padding: 0.25rem 0.75rem; font-size: 0.8rem; cursor: pointer; color: var(--color-muted);
}
.action-btn:hover { border-color: var(--color-primary); color: var(--color-primary); }
.modal-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,0.3);
  display: flex; align-items: center; justify-content: center; z-index: 100;
  border: none; padding: 0;
}
.modal-card {
  background: var(--color-surface); border-radius: var(--radius-card); padding: 2rem;
  width: 100%; max-width: 480px; max-height: 90vh; overflow-y: auto;
}
.modal-card h2 { margin: 0 0 1.25rem; font-size: 1.2rem; }
.field { display: flex; flex-direction: column; gap: 0.35rem; margin-bottom: 1rem; }
.field span { font-size: 0.85rem; font-weight: 500; }
.field input, .field select, .field textarea {
  padding: 0.5rem 0.75rem; border: 1px solid var(--color-border);
  border-radius: 6px; font-size: 0.9rem; font-family: inherit;
}
.field-short { max-width: 140px; }
.field-row { display: flex; gap: 1rem; }
.checkbox-field { flex-direction: row; align-items: center; gap: 0.5rem; }
.modal-actions { display: flex; gap: 0.75rem; justify-content: flex-end; margin-top: 1rem; }
.btn-cancel {
  padding: 0.5rem 1rem; background: none; border: 1px solid var(--color-border);
  border-radius: 6px; cursor: pointer; font-size: 0.85rem;
}
.loading-state { color: var(--color-muted); text-align: center; padding: 3rem; }
</style>
