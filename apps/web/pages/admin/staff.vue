<template>
  <AdminShell>
    <div class="admin-page-header">
      <div>
        <p class="eyebrow">People</p>
        <h1 class="display-title">Staff</h1>
        <p>Manage the artists customers can request during booking.</p>
      </div>
      <button class="btn-primary" @click="openCreate">Add staff</button>
    </div>

    <div v-if="loading" class="loading-state surface-panel">Loading staff...</div>

    <div v-else class="staff-grid">
      <article v-for="s in staffList" :key="s.id" class="staff-card surface-panel">
        <div class="staff-avatar">{{ getInitials(s.name) }}</div>
        <div class="staff-copy">
          <div class="staff-name">{{ s.name }}</div>
          <div class="staff-title">{{ s.title }}</div>
          <p>{{ s.bio || 'No bio added yet.' }}</p>
        </div>
        <div class="staff-card-footer">
          <span :class="['active-dot', s.active ? 'on' : 'off']" />
          <button class="btn-secondary action-btn" @click="openEdit(s)">Edit</button>
        </div>
      </article>
    </div>

    <dialog v-if="showModal" class="modal-overlay" @click.self="showModal = false">
      <form class="modal-card" @submit.prevent="handleSave">
        <h2>{{ editing ? 'Edit Staff' : 'New Staff' }}</h2>
        <label class="field">
          <span>Name</span>
          <input v-model="form.name" class="form-control" required />
        </label>
        <label class="field">
          <span>Title</span>
          <input v-model="form.title" class="form-control" required />
        </label>
        <label class="field">
          <span>Bio</span>
          <textarea v-model="form.bio" class="form-control" rows="3" />
        </label>
        <fieldset v-if="canEditServiceAssignments" class="field service-picker">
          <legend>Services</legend>
          <div class="service-checks">
            <label v-for="svc in allServices" :key="svc.id" class="checkbox-label">
              <input v-model="form.serviceIds" type="checkbox" :value="svc.id" @change="serviceIdsTouched = true" />
              <span>{{ svc.name }}</span>
            </label>
          </div>
        </fieldset>
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
import { buildStaffSavePayload } from '../../utils/staff-payload'

definePageMeta({
  middleware: 'admin-auth',
  layout: false
})

interface AdminService {
  id: string
  name: string
}

interface StaffServiceLink {
  serviceId: string
}

interface AdminStaff {
  id: string
  name: string
  title: string
  bio: string
  active: boolean
  staffServices?: StaffServiceLink[]
}

const config = useRuntimeConfig()
const baseUrl = config.public.apiBaseUrl

const staffList = ref<AdminStaff[]>([])
const allServices = ref<AdminService[]>([])
const loading = ref(true)
const showModal = ref(false)
const editing = ref<AdminStaff | null>(null)
const serviceAssignmentsLoaded = ref(false)
const serviceIdsTouched = ref(false)

const form = reactive({
  name: '',
  title: '',
  bio: '',
  active: true,
  serviceIds: [] as string[]
})

async function fetchData() {
  loading.value = true
  const [staff, services] = await Promise.all([
    $fetch<AdminStaff[]>(`${baseUrl}/admin/staff`, { credentials: 'include' }),
    $fetch<AdminService[]>(`${baseUrl}/admin/services`, { credentials: 'include' })
  ])
  staffList.value = staff
  allServices.value = services
  loading.value = false
}

await fetchData()

const canEditServiceAssignments = computed(() => !editing.value || serviceAssignmentsLoaded.value)

function getInitials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
}

function openCreate() {
  editing.value = null
  form.name = ''
  form.title = ''
  form.bio = ''
  form.active = true
  form.serviceIds = []
  serviceAssignmentsLoaded.value = true
  serviceIdsTouched.value = false
  showModal.value = true
}

function openEdit(staff: AdminStaff) {
  editing.value = staff
  form.name = staff.name
  form.title = staff.title
  form.bio = staff.bio ?? ''
  form.active = staff.active
  serviceAssignmentsLoaded.value = Array.isArray(staff.staffServices)
  serviceIdsTouched.value = false
  form.serviceIds = serviceAssignmentsLoaded.value
    ? staff.staffServices?.map((service) => service.serviceId) ?? []
    : []
  showModal.value = true
}

async function handleSave() {
  const payload = buildStaffSavePayload(form, {
    includeServiceIds: !editing.value || serviceAssignmentsLoaded.value || serviceIdsTouched.value
  })
  if (editing.value) {
    await $fetch(`${baseUrl}/admin/staff/${editing.value.id}`, {
      method: 'PATCH',
      credentials: 'include',
      body: payload
    })
  } else {
    await $fetch(`${baseUrl}/admin/staff`, {
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

.staff-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 1rem;
}

.staff-card {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 1rem;
  padding: 1rem;
}

.staff-avatar {
  width: 3rem;
  height: 3rem;
  border-radius: 999px;
  display: grid;
  place-items: center;
  background: var(--color-bg-strong);
  color: var(--color-primary);
  font-weight: 900;
}

.staff-copy {
  min-width: 0;
}

.staff-name {
  font-weight: 800;
}

.staff-title {
  color: var(--color-primary);
  font-size: 0.86rem;
  font-weight: 800;
  margin-top: 0.12rem;
}

.staff-copy p {
  color: var(--color-muted);
  font-size: 0.9rem;
  line-height: 1.5;
  margin: 0.45rem 0 0;
}

.staff-card-footer {
  grid-column: 1 / -1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  border-top: 1px solid var(--color-border);
  padding-top: 0.85rem;
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
  width: min(100%, 560px);
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

.service-picker {
  border: none;
  padding: 0;
}

.service-checks {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.45rem;
}

.checkbox-label,
.checkbox-field {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.checkbox-label {
  min-height: 2.35rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-card);
  background: var(--color-surface-strong);
  padding: 0.45rem 0.6rem;
}

.checkbox-label span {
  color: var(--color-ink);
  font-weight: 700;
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
  .modal-actions,
  .service-checks {
    display: grid;
    grid-template-columns: 1fr;
  }

  .staff-card {
    grid-template-columns: 1fr;
  }
}
</style>
