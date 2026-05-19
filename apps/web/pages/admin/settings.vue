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

    <form v-else class="settings-workspace" @submit.prevent="handleSave">
      <main class="settings-main">
        <section class="settings-section surface-panel">
          <div class="section-heading">
            <p class="eyebrow">Public Profile</p>
            <h2>Studio details</h2>
          </div>

          <div class="field-grid">
            <label class="field">
              <span>Shop name</span>
              <input v-model="form.name" class="form-control" required />
            </label>

            <label class="field">
              <span>Tagline</span>
              <input v-model="form.tagline" class="form-control" />
            </label>

            <label class="field field-wide">
              <span>Description</span>
              <textarea v-model="form.description" class="form-control" rows="4" />
            </label>
          </div>
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

            <label class="field field-wide">
              <span>Address</span>
              <input v-model="form.address" class="form-control" />
            </label>

            <label class="field field-wide">
              <span>Map URL</span>
              <input v-model="form.mapUrl" class="form-control" type="url" />
            </label>
          </div>
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

            <label class="field field-wide">
              <span>Receipt footer</span>
              <textarea v-model="form.receiptFooter" class="form-control" rows="3" />
            </label>
          </div>

          <p class="finance-preview">Tax preview {{ formatTaxRate(form.taxRateBps) }}</p>
        </section>

        <section class="settings-section surface-panel">
          <div class="section-heading">
            <p class="eyebrow">Search</p>
            <h2>SEO preview</h2>
          </div>

          <div class="field-grid">
            <label class="field field-wide">
              <span>SEO title</span>
              <input v-model="form.seoTitle" class="form-control" />
            </label>

            <label class="field field-wide">
              <span>SEO description</span>
              <textarea v-model="form.seoDescription" class="form-control" rows="4" />
            </label>
          </div>
        </section>
      </main>

      <aside class="settings-sidebar">
        <section class="preview-panel surface-panel" aria-label="Settings preview">
          <div class="section-heading">
            <p class="eyebrow">Preview</p>
            <h2>{{ preview.profileTitle }}</h2>
            <p>{{ preview.tagline }}</p>
          </div>

          <div class="preview-stack">
            <div class="preview-block">
              <span>Public description</span>
              <p>{{ preview.description }}</p>
            </div>

            <div class="preview-block">
              <span>Contact</span>
              <p>{{ preview.contactLine }}</p>
            </div>

            <div class="preview-block">
              <span>Address</span>
              <p>{{ preview.address }}</p>
            </div>

            <div class="preview-block">
              <span>Map</span>
              <p>{{ preview.mapStatus }}</p>
            </div>

            <div class="search-preview">
              <span>Search result</span>
              <strong>{{ preview.seoTitle }}</strong>
              <p>{{ preview.seoDescription }}</p>
            </div>
          </div>
        </section>

        <div class="settings-actions surface-panel">
          <div class="save-status" aria-live="polite">{{ saveMessage }}</div>
          <button type="submit" class="btn-primary" :disabled="saving">
            {{ saving ? 'Saving...' : 'Save settings' }}
          </button>
        </div>
      </aside>
    </form>
  </AdminShell>
</template>

<script setup lang="ts">
import type { SettingsFormLike } from '../../utils/admin-settings'
import { buildSettingsPreview, buildSettingsSavePayload, formatTaxRate } from '../../utils/admin-settings'
import { resolveRuntimeApiBaseUrl } from '../../utils/api-url'

definePageMeta({
  middleware: 'admin-auth',
  layout: false
})

type ShopSettings = SettingsFormLike

const config = useRuntimeConfig()
const baseUrl = resolveRuntimeApiBaseUrl(config, import.meta.server)
const requestHeaders = import.meta.server ? useRequestHeaders(['cookie']) : undefined

const loading = ref(true)
const saving = ref(false)
const saveMessage = ref('')
const sidebarShopName = useState<string | null>('admin-sidebar-shop-name', () => null)

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
  const settings = await $fetch<Partial<ShopSettings> | null>(`${baseUrl}/admin/shop-settings`, {
    credentials: 'include',
    headers: requestHeaders
  })
  if (settings) {
    Object.assign(form, settings)
    if (settings.name) sidebarShopName.value = settings.name
  }
} finally {
  loading.value = false
}

const preview = computed(() => buildSettingsPreview(form))

async function handleSave() {
  saving.value = true
  saveMessage.value = ''
  try {
    await $fetch(`${baseUrl}/admin/shop-settings`, {
      method: 'PATCH',
      credentials: 'include',
      headers: requestHeaders,
      body: buildSettingsSavePayload(form)
    })
    sidebarShopName.value = form.name
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

.settings-workspace {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(280px, 360px);
  gap: 1rem;
  align-items: start;
}

.settings-main,
.settings-sidebar,
.preview-stack {
  display: grid;
  gap: 1rem;
}

.settings-sidebar {
  position: sticky;
  top: 1rem;
}

.settings-section,
.preview-panel,
.settings-actions {
  padding: 1rem;
}

.settings-section,
.preview-panel {
  display: grid;
  gap: 1rem;
}

.section-heading h2 {
  margin: 0.2rem 0 0;
  font-size: 1.18rem;
}

.section-heading p:not(.eyebrow) {
  color: var(--color-muted);
  margin: 0.35rem 0 0;
}

.field-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
}

.field-wide {
  grid-column: 1 / -1;
}

.field {
  display: grid;
  gap: 0.35rem;
}

.field span,
.preview-block span,
.search-preview span {
  color: var(--color-ink-soft);
  font-size: 0.85rem;
  font-weight: 700;
}

.preview-block,
.search-preview {
  display: grid;
  gap: 0.3rem;
  border-top: 1px solid var(--color-border);
  padding-top: 0.9rem;
}

.preview-block p,
.search-preview p {
  color: var(--color-muted);
  line-height: 1.45;
  margin: 0;
  overflow-wrap: anywhere;
}

.search-preview {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-card);
  background: var(--color-surface-strong);
  padding: 0.9rem;
}

.finance-preview {
  color: var(--color-muted);
  font-size: 0.9rem;
  font-weight: 800;
  margin: 0;
}

.search-preview strong {
  color: var(--color-primary);
  line-height: 1.3;
  overflow-wrap: anywhere;
}

.settings-actions {
  display: grid;
  gap: 0.75rem;
}

.settings-actions .btn-primary {
  width: 100%;
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

@media (max-width: 980px) {
  .settings-workspace {
    grid-template-columns: 1fr;
  }

  .settings-sidebar {
    position: static;
  }
}

@media (max-width: 640px) {
  .admin-page-header,
  .field-grid {
    display: grid;
    grid-template-columns: 1fr;
  }
}
</style>
