<template>
  <AdminShell>
    <div class="page-header">
      <h1 class="page-heading">Settings</h1>
    </div>

    <div v-if="loading" class="loading-state">Loading...</div>

    <form v-else class="settings-form" @submit.prevent="handleSave">
      <label class="field">
        <span>Shop Name</span>
        <input v-model="form.name" required />
      </label>
      <label class="field">
        <span>Tagline</span>
        <input v-model="form.tagline" />
      </label>
      <label class="field">
        <span>Phone</span>
        <input v-model="form.phone" type="tel" />
      </label>
      <label class="field">
        <span>Address</span>
        <input v-model="form.address" />
      </label>
      <label class="field">
        <span>SEO Title</span>
        <input v-model="form.seoTitle" />
      </label>
      <label class="field">
        <span>SEO Description</span>
        <textarea v-model="form.seoDescription" rows="2" />
      </label>
      <button type="submit" class="btn-primary" :disabled="saving">
        {{ saving ? 'Saving...' : 'Save Settings' }}
      </button>
    </form>
  </AdminShell>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: 'admin-auth',
  layout: false
})

const config = useRuntimeConfig()
const baseUrl = config.public.apiBaseUrl

const loading = ref(true)
const saving = ref(false)
const form = reactive({
  name: '',
  tagline: '',
  phone: '',
  address: '',
  seoTitle: '',
  seoDescription: ''
})

try {
  const settings = await $fetch<any>(`${baseUrl}/admin/shop-settings`, { credentials: 'include' })
  if (settings) Object.assign(form, settings)
} finally {
  loading.value = false
}

async function handleSave() {
  saving.value = true
  await $fetch(`${baseUrl}/admin/shop-settings`, {
    method: 'PATCH',
    credentials: 'include',
    body: { ...form }
  })
  saving.value = false
}
</script>

<style scoped>
.page-header { margin-bottom: 1.5rem; }
.page-heading { font-size: 1.5rem; font-weight: 700; margin: 0; }
.settings-form {
  background: var(--color-surface); border: 1px solid var(--color-border);
  border-radius: var(--radius-card); padding: 2rem; max-width: 560px;
}
.field { display: flex; flex-direction: column; gap: 0.35rem; margin-bottom: 1.25rem; }
.field span { font-size: 0.85rem; font-weight: 500; }
.field input, .field textarea {
  padding: 0.5rem 0.75rem; border: 1px solid var(--color-border);
  border-radius: 6px; font-size: 0.9rem; font-family: inherit;
}
.btn-primary { padding: 0.6rem 1.25rem; background: var(--color-primary); color: #fff; border: none; border-radius: 6px; font-weight: 600; font-size: 0.9rem; cursor: pointer; }
.btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
.loading-state { color: var(--color-muted); text-align: center; padding: 3rem; }
</style>
