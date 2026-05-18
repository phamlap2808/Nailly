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

    <section v-else class="staff-directory surface-panel">
      <div class="staff-toolbar" aria-label="Staff filters">
        <label class="filter-field search-field">
          <span>Search</span>
          <input
            v-model="staffSearchQuery"
            class="form-control"
            type="search"
            placeholder="Search staff"
          />
        </label>
        <label class="filter-field">
          <span>Status</span>
          <select v-model="statusFilter" class="form-control">
            <option value="all">All</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </label>
        <label class="filter-field">
          <span>Rows</span>
          <select v-model.number="pageSize" class="form-control">
            <option :value="5">5</option>
            <option :value="10">10</option>
            <option :value="20">20</option>
          </select>
        </label>
      </div>

      <div v-if="!filteredStaffList.length" class="empty-state">
        {{ staffList.length ? 'No staff match the current filters.' : 'No staff added yet.' }}
      </div>

      <div v-else class="staff-table" role="table" aria-label="Staff">
        <div class="staff-table-head" role="row">
          <span>Staff</span>
          <span>Title</span>
          <span>Services</span>
          <span>Commission</span>
          <span>Status</span>
          <span />
        </div>
        <div v-for="s in paginatedStaffList" :key="s.id" class="staff-row" role="row">
          <div class="staff-person">
            <div class="staff-avatar">{{ getInitials(s.name) }}</div>
            <div class="staff-copy">
              <div class="staff-name">{{ s.name }}</div>
              <p>{{ s.bio || 'No bio added yet.' }}</p>
            </div>
          </div>
          <span class="staff-meta">{{ s.title }}</span>
          <span class="staff-meta">{{ getStaffServiceLabel(s) }}</span>
          <span class="staff-meta">{{ formatCommissionRate(s.commissionRateBps) }}</span>
          <span :class="['status-pill', s.active ? 'status-pill--active' : 'status-pill--inactive']">
            {{ s.active ? 'Active' : 'Inactive' }}
          </span>
          <button class="btn-secondary action-btn" @click="openEdit(s)">Edit</button>
        </div>
      </div>

      <div v-if="filteredStaffList.length" class="pagination-bar" aria-label="Staff pagination">
        <span>{{ paginationSummary }}</span>
        <div class="pagination-actions">
          <button
            class="btn-secondary"
            type="button"
            :disabled="staffPage.currentPage <= 1"
            @click="goToPage(staffPage.currentPage - 1)"
          >
            Previous
          </button>
          <span class="page-indicator">
            Page {{ staffPage.currentPage }} of {{ staffPage.totalPages }}
          </span>
          <button
            class="btn-secondary"
            type="button"
            :disabled="staffPage.currentPage >= staffPage.totalPages"
            @click="goToPage(staffPage.currentPage + 1)"
          >
            Next
          </button>
        </div>
      </div>
    </section>

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
        <label class="field">
          <span>Commission %</span>
          <input v-model.number="commissionPercent" class="form-control" type="number" min="0" max="100" step="0.01" />
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
import type { StaffStatusFilter } from '../../utils/admin-staff-table'
import {
  filterStaffRows,
  formatCommissionRate,
  getStaffServiceLabel,
  paginateStaffRows
} from '../../utils/admin-staff-table'
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
  commissionRateBps: number
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
const staffSearchQuery = ref('')
const statusFilter = ref<StaffStatusFilter>('all')
const pageSize = ref(5)
const currentPage = ref(1)

const form = reactive({
  name: '',
  title: '',
  bio: '',
  active: true,
  commissionRateBps: 4000,
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
const filteredStaffList = computed(() =>
  filterStaffRows(staffList.value, {
    searchQuery: staffSearchQuery.value,
    status: statusFilter.value
  })
)
const staffPage = computed(() => paginateStaffRows(filteredStaffList.value, currentPage.value, pageSize.value))
const paginatedStaffList = computed(() => staffPage.value.items)
const paginationSummary = computed(() => {
  if (!staffPage.value.totalItems) return '0 staff'

  return `${staffPage.value.startItem}-${staffPage.value.endItem} of ${staffPage.value.totalItems} staff`
})

watch([staffSearchQuery, statusFilter, pageSize], () => {
  currentPage.value = 1
})

watch(staffPage, (nextPage) => {
  if (currentPage.value !== nextPage.currentPage) {
    currentPage.value = nextPage.currentPage
  }
})

const commissionPercent = computed({
  get: () => form.commissionRateBps / 100,
  set: (value: number) => {
    form.commissionRateBps = Math.round(Number(value || 0) * 100)
  }
})

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
  form.commissionRateBps = 4000
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
  form.commissionRateBps = staff.commissionRateBps ?? 4000
  serviceAssignmentsLoaded.value = Array.isArray(staff.staffServices)
  serviceIdsTouched.value = false
  form.serviceIds = serviceAssignmentsLoaded.value
    ? staff.staffServices?.map((service) => service.serviceId) ?? []
    : []
  showModal.value = true
}

function goToPage(page: number) {
  currentPage.value = page
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
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.25rem;
}

.admin-page-header > .btn-primary {
  align-self: flex-start;
}

.admin-page-header h1 {
  margin: 0.3rem 0 0;
  font-size: clamp(2rem, 5vw, 3.4rem);
}

.admin-page-header p:not(.eyebrow) {
  color: var(--color-muted);
  margin: 0.4rem 0 0;
}

.staff-directory {
  display: grid;
  gap: 1rem;
  padding: 1rem;
}

.staff-toolbar {
  display: grid;
  grid-template-columns: minmax(220px, 1fr) minmax(140px, 180px) minmax(110px, 130px);
  gap: 0.75rem;
  align-items: end;
}

.filter-field {
  display: grid;
  gap: 0.35rem;
}

.filter-field span {
  color: var(--color-ink-soft);
  font-size: 0.85rem;
  font-weight: 700;
}

.staff-table {
  display: grid;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-card);
  overflow: hidden;
}

.staff-table-head,
.staff-row {
  display: grid;
  grid-template-columns: minmax(260px, 1.5fr) minmax(150px, 0.75fr) minmax(120px, 0.55fr) 120px 100px auto;
  gap: 1rem;
  align-items: center;
  padding: 0.85rem 1rem;
}

.staff-table-head {
  background: rgba(239, 226, 214, 0.55);
  color: var(--color-muted);
  font-size: 0.75rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.staff-row {
  border-top: 1px solid var(--color-border);
  background: var(--color-surface-strong);
}

.staff-row:first-of-type {
  border-top: none;
}

.staff-person {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 0.75rem;
  align-items: center;
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

.staff-copy p {
  color: var(--color-muted);
  font-size: 0.9rem;
  line-height: 1.5;
  margin: 0.18rem 0 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.staff-meta {
  color: var(--color-ink-soft);
  font-weight: 800;
}

.status-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 1.6rem;
  border-radius: 999px;
  padding: 0.2rem 0.65rem;
  font-size: 0.74rem;
  font-weight: 800;
}

.status-pill--active {
  background: #e6f0e7;
  color: var(--color-success);
}

.status-pill--inactive {
  background: #ede9e3;
  color: var(--color-muted);
}

.action-btn {
  min-height: 2rem;
  padding: 0.35rem 0.7rem;
}

.pagination-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  color: var(--color-muted);
  font-size: 0.9rem;
  font-weight: 700;
}

.pagination-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.page-indicator {
  color: var(--color-ink-soft);
  min-width: 6.5rem;
  text-align: center;
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

.loading-state,
.empty-state {
  color: var(--color-muted);
  padding: 2rem;
}

.empty-state {
  border: 1px dashed var(--color-border);
  border-radius: var(--radius-card);
}

@media (max-width: 980px) {
  .staff-toolbar {
    grid-template-columns: 1fr 1fr;
  }

  .search-field {
    grid-column: 1 / -1;
  }

  .staff-table-head {
    display: none;
  }

  .staff-row {
    grid-template-columns: 1fr;
    gap: 0.65rem;
  }

  .action-btn {
    justify-self: start;
  }
}

@media (max-width: 640px) {
  .admin-page-header,
  .modal-actions,
  .service-checks,
  .staff-toolbar,
  .pagination-bar,
  .pagination-actions {
    display: grid;
    grid-template-columns: 1fr;
  }

  .admin-page-header > .btn-primary,
  .pagination-actions button {
    width: 100%;
  }

  .staff-person {
    grid-template-columns: 1fr;
  }
}
</style>
