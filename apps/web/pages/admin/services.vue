<template>
  <AdminShell>
    <div class="admin-page-header">
      <div>
        <p class="eyebrow">Catalog</p>
        <h1 class="display-title">Services</h1>
        <p>Manage categories and service items in a clear catalog hierarchy.</p>
      </div>
      <div class="header-actions">
        <button class="btn-secondary" @click="openCreateCategory">Add category</button>
      </div>
    </div>

    <div v-if="loading" class="loading-state surface-panel">Loading services...</div>

    <div v-else class="catalog-shell">
      <aside class="category-tree surface-panel" aria-label="Service categories">
        <div class="tree-header">
          <div>
            <p class="eyebrow">Hierarchy</p>
            <h2>Categories</h2>
          </div>
        </div>

        <button
          type="button"
          :class="['category-node', { selected: selectedCategoryId === 'all' }]"
          @click="selectedCategoryId = 'all'"
        >
          <span class="node-copy">
            <strong>{{ hierarchy.all.name }}</strong>
            <small>{{ hierarchy.all.serviceCount }} services</small>
          </span>
          <span class="node-count">{{ hierarchy.all.activeServiceCount }} active</span>
        </button>

        <div class="tree-divider" />

        <button
          v-for="cat in hierarchy.categories"
          :key="cat.id"
          type="button"
          :class="['category-node', { selected: selectedCategoryId === cat.id, inactive: !cat.active }]"
          @click="selectedCategoryId = cat.id"
        >
          <span class="node-copy">
            <strong>{{ cat.name }}</strong>
            <small>{{ cat.serviceCount }} services</small>
          </span>
          <span class="node-meta">
            <span :class="['active-dot', cat.active ? 'on' : 'off']" />
            <span class="node-count">{{ cat.activeServiceCount }} active</span>
          </span>
        </button>
      </aside>

      <section class="catalog-detail surface-panel">
        <label class="mobile-category-field">
          <span>Category</span>
          <select v-model="selectedCategoryId" class="form-control">
            <option value="all">All services</option>
            <option v-for="cat in categories" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
          </select>
        </label>

        <div class="detail-header">
          <div>
            <p class="eyebrow">{{ selectedNode.isAll ? 'Catalog' : 'Category' }}</p>
            <h2>{{ selectedNode.name }}</h2>
            <p>{{ selectedNode.description || 'No description added yet.' }}</p>
          </div>
          <div class="detail-actions">
            <button
              v-if="!selectedNode.isAll"
              class="btn-secondary"
              @click="openEditCategory(selectedNode.id)"
            >
              Edit category
            </button>
            <button
              class="btn-primary"
              :disabled="!categories.length"
              @click="openCreate(selectedNode.isAll ? undefined : selectedNode.id)"
            >
              Add service
            </button>
          </div>
        </div>

        <div class="catalog-toolbar" aria-label="Catalog filters">
          <label class="filter-field search-field">
            <span>Search</span>
            <input
              v-model="serviceSearchQuery"
              class="form-control"
              type="search"
              placeholder="Search services"
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

        <div v-if="!filteredServices.length" class="empty-state">
          {{ visibleServices.length ? 'No services match the current filters.' : 'No services in this category yet.' }}
        </div>

        <template v-else>
          <div class="service-table" role="table" aria-label="Services">
            <div class="service-table-head" role="row">
              <span>Item</span>
              <span>Duration</span>
              <span>Price</span>
              <span>Status</span>
              <span />
            </div>
            <div v-for="svc in paginatedServices" :key="svc.id" class="service-row" role="row">
              <div class="service-main">
                <strong>{{ svc.name }}</strong>
                <p>{{ svc.description }}</p>
              </div>
              <span class="service-meta">{{ svc.durationMinutes }} min</span>
              <span class="service-meta">{{ formatPrice(svc.priceCents) }}</span>
              <span :class="['status-pill', svc.active ? 'status-pill--active' : 'status-pill--inactive']">
                {{ svc.active ? 'Active' : 'Inactive' }}
              </span>
              <button class="btn-secondary action-btn" @click="openEdit(svc)">Edit</button>
            </div>
          </div>

          <div class="pagination-bar" aria-label="Catalog pagination">
            <span>{{ paginationSummary }}</span>
            <div class="pagination-actions">
              <button
                class="btn-secondary"
                type="button"
                :disabled="catalogPage.currentPage <= 1"
                @click="goToPage(catalogPage.currentPage - 1)"
              >
                Previous
              </button>
              <span class="page-indicator">
                Page {{ catalogPage.currentPage }} of {{ catalogPage.totalPages }}
              </span>
              <button
                class="btn-secondary"
                type="button"
                :disabled="catalogPage.currentPage >= catalogPage.totalPages"
                @click="goToPage(catalogPage.currentPage + 1)"
              >
                Next
              </button>
            </div>
          </div>
        </template>
      </section>
    </div>

    <dialog v-if="showCategoryModal" class="modal-overlay" @click.self="showCategoryModal = false">
      <form class="modal-card" @submit.prevent="handleSaveCategory">
        <h2>{{ editingCategory ? 'Edit Category' : 'New Category' }}</h2>
        <label class="field">
          <span>Name</span>
          <input v-model="categoryForm.name" class="form-control" required />
        </label>
        <label class="field">
          <span>Description</span>
          <textarea v-model="categoryForm.description" class="form-control" rows="3" required />
        </label>
        <label class="field checkbox-field">
          <input v-model="categoryForm.active" type="checkbox" />
          <span>Active</span>
        </label>
        <div class="modal-actions">
          <button type="button" class="btn-secondary" @click="showCategoryModal = false">Cancel</button>
          <button type="submit" class="btn-primary">{{ editingCategory ? 'Update' : 'Create' }}</button>
        </div>
      </form>
    </dialog>

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
import type { CatalogStatusFilter } from '../../utils/admin-service-catalog'
import {
  filterCatalogServices,
  paginateCatalogServices
} from '../../utils/admin-service-catalog'
import {
  buildServiceHierarchy,
  getSelectedCategoryNode,
  getServicesForCategorySelection
} from '../../utils/admin-service-hierarchy'

definePageMeta({
  middleware: 'admin-auth',
  layout: false
})

interface ServiceCategory {
  id: string
  name: string
  description: string
  active: boolean
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
const showCategoryModal = ref(false)
const editing = ref<AdminService | null>(null)
const editingCategory = ref<ServiceCategory | null>(null)
const selectedCategoryId = ref('all')
const serviceSearchQuery = ref('')
const statusFilter = ref<CatalogStatusFilter>('all')
const pageSize = ref(5)
const currentPage = ref(1)

const form = reactive({
  name: '',
  description: '',
  categoryId: '',
  durationMinutes: 30,
  priceCents: 0,
  active: true
})

const categoryForm = reactive({
  name: '',
  description: '',
  active: true
})

const hierarchy = computed(() => buildServiceHierarchy(categories.value, services.value))
const selectedNode = computed(() => getSelectedCategoryNode(hierarchy.value, selectedCategoryId.value))
const visibleServices = computed(() => getServicesForCategorySelection(services.value, selectedNode.value.id))
const filteredServices = computed(() =>
  filterCatalogServices(visibleServices.value, {
    searchQuery: serviceSearchQuery.value,
    status: statusFilter.value
  })
)
const catalogPage = computed(() => paginateCatalogServices(filteredServices.value, currentPage.value, pageSize.value))
const paginatedServices = computed(() => catalogPage.value.items)
const paginationSummary = computed(() => {
  if (!catalogPage.value.totalItems) return '0 services'

  return `${catalogPage.value.startItem}-${catalogPage.value.endItem} of ${catalogPage.value.totalItems} services`
})

watch([selectedCategoryId, serviceSearchQuery, statusFilter, pageSize], () => {
  currentPage.value = 1
})

watch(catalogPage, (nextPage) => {
  if (currentPage.value !== nextPage.currentPage) {
    currentPage.value = nextPage.currentPage
  }
})

async function fetchData() {
  loading.value = true
  const [cats, svcs] = await Promise.all([
    $fetch<ServiceCategory[]>(`${baseUrl}/admin/service-categories`, { credentials: 'include' }),
    $fetch<AdminService[]>(`${baseUrl}/admin/services`, { credentials: 'include' })
  ])
  categories.value = cats
  services.value = svcs
  if (selectedCategoryId.value !== 'all' && !cats.some((cat) => cat.id === selectedCategoryId.value)) {
    selectedCategoryId.value = 'all'
  }
  loading.value = false
}

await fetchData()

function openCreate(defaultCategoryId?: string) {
  editing.value = null
  form.name = ''
  form.description = ''
  form.categoryId = defaultCategoryId ?? categories.value[0]?.id ?? ''
  form.durationMinutes = 30
  form.priceCents = 0
  form.active = true
  showModal.value = true
}

function goToPage(page: number) {
  currentPage.value = page
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

function openCreateCategory() {
  editingCategory.value = null
  categoryForm.name = ''
  categoryForm.description = ''
  categoryForm.active = true
  showCategoryModal.value = true
}

function openEditCategory(categoryId: string) {
  const category = categories.value.find((cat) => cat.id === categoryId)
  if (!category) return
  editingCategory.value = category
  categoryForm.name = category.name
  categoryForm.description = category.description
  categoryForm.active = category.active
  showCategoryModal.value = true
}

async function handleSaveCategory() {
  const payload = { ...categoryForm, sortOrder: categories.value.length + 1 }
  if (editingCategory.value) {
    await $fetch(`${baseUrl}/admin/service-categories/${editingCategory.value.id}`, {
      method: 'PATCH',
      credentials: 'include',
      body: categoryForm
    })
  } else {
    const created = await $fetch<ServiceCategory>(`${baseUrl}/admin/service-categories`, {
      method: 'POST',
      credentials: 'include',
      body: payload
    })
    selectedCategoryId.value = created.id
  }
  showCategoryModal.value = false
  await fetchData()
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
  selectedCategoryId.value = form.categoryId
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

.header-actions,
.detail-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.catalog-shell {
  display: grid;
  grid-template-columns: minmax(240px, 300px) minmax(0, 1fr);
  gap: 1rem;
  align-items: start;
}

.category-tree,
.catalog-detail {
  padding: 1rem;
}

.category-tree {
  position: sticky;
  top: 1rem;
  display: grid;
  gap: 0.55rem;
}

.tree-header {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  padding-bottom: 0.35rem;
}

.tree-header h2 {
  margin: 0.2rem 0 0;
  font-size: 1rem;
}

.category-node {
  width: 100%;
  min-height: 4rem;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 0.75rem;
  align-items: center;
  border: 1px solid transparent;
  border-radius: var(--radius-card);
  background: transparent;
  color: var(--color-ink);
  padding: 0.75rem;
  text-align: left;
  cursor: pointer;
}

.category-node:hover,
.category-node.selected {
  border-color: var(--color-border);
  background: var(--color-surface-strong);
}

.category-node.selected {
  box-shadow: inset 3px 0 0 var(--color-primary);
}

.category-node.inactive {
  color: var(--color-muted);
}

.node-copy {
  display: grid;
  gap: 0.1rem;
  min-width: 0;
}

.node-copy strong {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.node-copy small,
.node-count {
  color: var(--color-muted);
  font-size: 0.78rem;
  font-weight: 700;
}

.node-meta {
  display: flex;
  align-items: center;
  gap: 0.45rem;
}

.tree-divider {
  height: 1px;
  background: var(--color-border);
  margin: 0.25rem 0;
}

.mobile-category-field {
  display: none;
}

.detail-header {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  border-bottom: 1px solid var(--color-border);
  padding-bottom: 1rem;
}

.detail-header h2 {
  margin: 0.25rem 0 0;
  font-size: 1.45rem;
}

.detail-header p:not(.eyebrow) {
  color: var(--color-muted);
  margin: 0.35rem 0 0;
}

.catalog-toolbar {
  display: grid;
  grid-template-columns: minmax(220px, 1fr) minmax(140px, 180px) minmax(110px, 130px);
  gap: 0.75rem;
  align-items: end;
  margin: 1rem 0;
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

.service-table {
  display: grid;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-card);
  overflow: hidden;
}

.service-table-head,
.service-row {
  display: grid;
  grid-template-columns: minmax(220px, 1.6fr) 100px 100px 100px auto;
  gap: 1rem;
  align-items: center;
  padding: 0.85rem 1rem;
}

.service-table-head {
  background: rgba(239, 226, 214, 0.55);
  color: var(--color-muted);
  font-size: 0.75rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.service-row {
  border-top: 1px solid var(--color-border);
  background: var(--color-surface-strong);
}

.service-row:first-of-type {
  border-top: none;
}

.service-main {
  min-width: 0;
}

.service-main strong {
  display: block;
  font-weight: 850;
}

.service-main p {
  color: var(--color-muted);
  font-size: 0.86rem;
  line-height: 1.45;
  margin: 0.2rem 0 0;
}

.service-meta {
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

.active-dot {
  width: 0.55rem;
  height: 0.55rem;
  border-radius: 999px;
  background: var(--color-border);
}

.active-dot.on {
  background: var(--color-success);
}

.active-dot.off {
  background: var(--color-muted);
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
  margin-top: 0.8rem;
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
.field legend,
.mobile-category-field span {
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

.loading-state,
.empty-state {
  color: var(--color-muted);
  padding: 2rem;
}

.empty-state {
  border: 1px dashed var(--color-border);
  border-radius: var(--radius-card);
  margin-top: 1rem;
}

@media (max-width: 980px) {
  .catalog-shell {
    grid-template-columns: 1fr;
  }

  .category-tree {
    position: static;
  }

  .service-table-head {
    display: none;
  }

  .service-row {
    grid-template-columns: 1fr;
    gap: 0.65rem;
  }

  .catalog-toolbar {
    grid-template-columns: 1fr 1fr;
  }

  .search-field {
    grid-column: 1 / -1;
  }

  .action-btn {
    justify-self: start;
  }
}

@media (max-width: 640px) {
  .admin-page-header,
  .header-actions,
  .detail-header,
  .detail-actions,
  .modal-actions {
    display: grid;
    grid-template-columns: 1fr;
  }

  .category-tree {
    display: none;
  }

  .mobile-category-field {
    display: grid;
    gap: 0.35rem;
    margin-bottom: 1rem;
  }

  .catalog-toolbar,
  .pagination-bar,
  .pagination-actions {
    grid-template-columns: 1fr;
  }

  .pagination-bar,
  .pagination-actions {
    display: grid;
  }

  .pagination-actions button {
    width: 100%;
  }

  .field-row {
    display: grid;
  }
}
</style>
