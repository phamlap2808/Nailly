<template>
  <AdminShell>
    <div class="admin-page-header">
      <div>
        <p class="eyebrow">Studio</p>
        <h1 class="display-title">Settings</h1>
        <p>Update the public salon profile, contact details, and search preview.</p>
      </div>
    </div>

    <div v-if="loading" class="loading-state surface-panel">Loading settings...</div>

    <form v-else class="settings-layout" @submit.prevent="handleSave">
      <section class="settings-section surface-panel">
        <div class="section-heading">
          <p class="eyebrow">Public Profile</p>
          <h2>Studio details</h2>
        </div>
        <label class="field">
          <span>Shop name</span>
          <input v-model="form.name" class="form-control" required />
        </label>
        <label class="field">
          <span>Tagline</span>
          <input v-model="form.tagline" class="form-control" />
        </label>
        <label class="field">
          <span>Description</span>
          <textarea v-model="form.description" class="form-control" rows="3" />
        </label>
      </section>

      <section class="settings-section surface-panel">
        <div class="section-heading">
          <p class="eyebrow">Contact</p>
          <h2>Location and phone</h2>
        </div>
        <div class="field-grid">
          <label class="field">
            <span>Phone</span>
            <input v-model="form.phone" class="form-control" type="tel" />
          </label>
          <label class="field">
            <span>Email</span>
            <input v-model="form.email" class="form-control" type="email" />
          </label>
        </div>
        <label class="field">
          <span>Address</span>
          <input v-model="form.address" class="form-control" />
        </label>
        <label class="field">
          <span>Map URL</span>
          <input v-model="form.mapUrl" class="form-control" type="url" />
        </label>
      </section>

      <section class="settings-section surface-panel">
        <div class="section-heading">
          <p class="eyebrow">Search</p>
          <h2>SEO preview</h2>
        </div>
        <label class="field">
          <span>SEO title</span>
          <input v-model="form.seoTitle" class="form-control" />
        </label>
        <label class="field">
          <span>SEO description</span>
          <textarea v-model="form.seoDescription" class="form-control" rows="3" />
        </label>
      </section>

      <section class="settings-section surface-panel">
        <div class="section-heading">
          <p class="eyebrow">Finance</p>
          <h2>Taxes and receipts</h2>
        </div>
        <div class="field-grid">
          <label class="field">
            <span>Tax %</span>
            <input v-model.number="taxPercent" class="form-control" type="number" min="0" max="100" step="0.01" />
          </label>
          <label class="field">
            <span>Invoice prefix</span>
            <input v-model="form.invoicePrefix" class="form-control" maxlength="12" />
          </label>
        </div>
        <label class="field">
          <span>Receipt footer</span>
          <textarea v-model="form.receiptFooter" class="form-control" rows="3" />
        </label>
        <p class="finance-preview">Tax preview {{ formatTaxRate(form.taxRateBps) }}</p>
      </section>

      <div class="settings-actions">
        <div class="save-status" aria-live="polite">{{ saveMessage }}</div>
        <button type="submit" class="btn-primary" :disabled="saving">
          {{ saving ? 'Saving...' : 'Save settings' }}
        </button>
      </div>
    </form>
  </AdminShell>
</template>

<script setup lang="ts">
import { formatTaxRate } from '../../utils/admin-settings'

definePageMeta({
  middleware: 'admin-auth',
  layout: false
})

interface ShopSettings {
  name: string
  tagline: string
  description: string
  phone: string
  email: string | null
  address: string
  mapUrl: string | null
  seoTitle: string
  seoDescription: string
  taxRateBps: number
  invoicePrefix: string
  receiptFooter: string
}

const config = useRuntimeConfig()
const baseUrl = config.public.apiBaseUrl

const loading = ref(true)
const saving = ref(false)
const saveMessage = ref('')

const form = reactive<ShopSettings>({
  name: '',
  tagline: '',
  description: '',
  phone: '',
  email: '',
  address: '',
  mapUrl: '',
  seoTitle: '',
  seoDescription: '',
  taxRateBps: 825,
  invoicePrefix: 'INV',
  receiptFooter: 'Thank you for visiting Luma Nail Studio.'
})

const taxPercent = computed({
  get: () => form.taxRateBps / 100,
  set: (value: number) => {
    form.taxRateBps = Math.round(Number(value || 0) * 100)
  }
})

try {
  const settings = await $fetch<Partial<ShopSettings> | null>(`${baseUrl}/admin/shop-settings`, { credentials: 'include' })
  if (settings) Object.assign(form, settings)
} finally {
  loading.value = false
}

async function handleSave() {
  saving.value = true
  saveMessage.value = ''
  try {
    await $fetch(`${baseUrl}/admin/shop-settings`, {
      method: 'PATCH',
      credentials: 'include',
      body: {
        ...form,
        email: form.email || null,
        mapUrl: form.mapUrl || null,
        invoicePrefix: form.invoicePrefix || 'INV',
        receiptFooter: form.receiptFooter || ''
      }
    })
    saveMessage.value = 'Settings saved.'
  } finally {
    saving.value = false
  }
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

.settings-layout {
  display: grid;
  gap: 1rem;
  max-width: 860px;
}

.settings-section {
  display: grid;
  gap: 1rem;
  padding: 1rem;
}

.section-heading h2 {
  margin: 0.2rem 0 0;
  font-size: 1.12rem;
}

.field-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
}

.field {
  display: grid;
  gap: 0.35rem;
}

.field span {
  color: var(--color-ink-soft);
  font-size: 0.85rem;
  font-weight: 700;
}

.finance-preview {
  color: var(--color-muted);
  font-size: 0.9rem;
  font-weight: 800;
  margin: 0;
}

.settings-actions {
  position: sticky;
  bottom: 1rem;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 1rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-card);
  background: rgba(255, 250, 244, 0.94);
  box-shadow: var(--shadow-soft);
  padding: 0.75rem;
}

.save-status {
  min-height: 1.5rem;
  color: var(--color-success);
  font-size: 0.85rem;
  font-weight: 800;
}

.loading-state {
  color: var(--color-muted);
  padding: 2rem;
}

@media (max-width: 640px) {
  .admin-page-header,
  .field-grid,
  .settings-actions {
    display: grid;
    grid-template-columns: 1fr;
  }

  .settings-actions {
    bottom: 0.75rem;
  }
}
</style>
