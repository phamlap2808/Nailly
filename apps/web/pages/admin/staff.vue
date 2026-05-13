<template>
  <AdminShell>
    <div class="page-header">
      <h1 class="page-heading">Staff</h1>
      <button class="btn-primary" @click="openCreate">+ Add Staff</button>
    </div>

    <div v-if="loading" class="loading-state">Loading...</div>

    <div v-else class="staff-grid">
      <div v-for="s in staffList" :key="s.id" class="staff-card">
        <div class="staff-name">{{ s.name }}</div>
        <div class="staff-title">{{ s.title }}</div>
        <button class="action-btn" @click="openEdit(s)">Edit</button>
      </div>
    </div>

    <!-- Create/Edit Modal -->
    <dialog v-if="showModal" class="modal-overlay" @click.self="showModal = false">
      <form class="modal-card" @submit.prevent="handleSave">
        <h2>{{ editing ? 'Edit Staff' : 'New Staff' }}</h2>
        <label class="field">
          <span>Name</span>
          <input v-model="form.name" required />
        </label>
        <label class="field">
          <span>Title</span>
          <input v-model="form.title" required />
        </label>
        <label class="field">
          <span>Bio</span>
          <textarea v-model="form.bio" rows="2" />
        </label>
        <fieldset class="field">
          <legend>Services</legend>
          <label v-for="svc in allServices" :key="svc.id" class="checkbox-label">
            <input type="checkbox" :value="svc.id" v-model="form.serviceIds" />
            {{ svc.name }}
          </label>
        </fieldset>
        <div class="modal-actions">
          <button type="button" class="btn-cancel" @click="showModal = false">Cancel</button>
          <button type="submit" class="btn-primary">{{ editing ? 'Update' : 'Create' }}</button>
        </div>
      </form>
    </dialog>
  </AdminShell>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: 'admin-auth',
  layout: false
})

const config = useRuntimeConfig()
const baseUrl = config.public.apiBaseUrl

const staffList = ref<any[]>([])
const allServices = ref<any[]>([])
const loading = ref(true)
const showModal = ref(false)
const editing = ref<any>(null)

const form = reactive({
  name: '',
  title: '',
  bio: '',
  serviceIds: [] as string[]
})

async function fetchData() {
  loading.value = true
  const [staff, services] = await Promise.all([
    $fetch<any[]>(`${baseUrl}/admin/staff`, { credentials: 'include' }),
    $fetch<any[]>(`${baseUrl}/admin/services`, { credentials: 'include' })
  ])
  staffList.value = staff
  allServices.value = services
  loading.value = false
}

await fetchData()

function openCreate() {
  editing.value = null
  form.name = ''
  form.title = ''
  form.bio = ''
  form.serviceIds = []
  showModal.value = true
}

function openEdit(s: any) {
  editing.value = s
  form.name = s.name
  form.title = s.title
  form.bio = s.bio ?? ''
  form.serviceIds = s.staffServices?.map((ss: any) => ss.serviceId) ?? []
  showModal.value = true
}

async function handleSave() {
  const { serviceIds, ...staffData } = form
  if (editing.value) {
    await $fetch(`${baseUrl}/admin/staff/${editing.value.id}`, {
      method: 'PATCH',
      credentials: 'include',
      body: { ...staffData, serviceIds }
    })
  } else {
    await $fetch(`${baseUrl}/admin/staff`, {
      method: 'POST',
      credentials: 'include',
      body: { ...staffData, serviceIds }
    })
  }
  showModal.value = false
  await fetchData()
}
</script>

<style scoped>
.page-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.5rem; }
.page-heading { font-size: 1.5rem; font-weight: 700; margin: 0; }
.btn-primary { padding: 0.5rem 1rem; background: var(--color-primary); color: #fff; border: none; border-radius: 6px; font-weight: 600; font-size: 0.85rem; cursor: pointer; }
.staff-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 1rem; }
.staff-card { background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-card); padding: 1.25rem; }
.staff-name { font-weight: 600; font-size: 1rem; }
.staff-title { color: var(--color-muted); font-size: 0.85rem; margin: 0.25rem 0 0.75rem; }
.action-btn { background: none; border: 1px solid var(--color-border); border-radius: 4px; padding: 0.25rem 0.75rem; font-size: 0.8rem; cursor: pointer; color: var(--color-muted); }
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; z-index: 100; border: none; padding: 0; }
.modal-card { background: var(--color-surface); border-radius: var(--radius-card); padding: 2rem; width: 100%; max-width: 480px; max-height: 90vh; overflow-y: auto; }
.modal-card h2 { margin: 0 0 1.25rem; font-size: 1.2rem; }
.field { display: flex; flex-direction: column; gap: 0.35rem; margin-bottom: 1rem; }
.field span, .field legend { font-size: 0.85rem; font-weight: 500; }
.field input, .field textarea { padding: 0.5rem 0.75rem; border: 1px solid var(--color-border); border-radius: 6px; font-size: 0.9rem; font-family: inherit; }
.checkbox-label { display: flex; align-items: center; gap: 0.5rem; font-size: 0.85rem; padding: 0.15rem 0; cursor: pointer; }
.modal-actions { display: flex; gap: 0.75rem; justify-content: flex-end; margin-top: 1rem; }
.btn-cancel { padding: 0.5rem 1rem; background: none; border: 1px solid var(--color-border); border-radius: 6px; cursor: pointer; font-size: 0.85rem; }
.loading-state { color: var(--color-muted); text-align: center; padding: 3rem; }
fieldset.field { border: none; padding: 0; }
</style>
