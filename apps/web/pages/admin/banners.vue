<template>
  <AdminShell>
    <div class="admin-page-header">
      <div>
        <p class="eyebrow">Content</p>
        <h1 class="display-title">Banners</h1>
        <p>Manage homepage hero banners with a real preview before publishing.</p>
      </div>
      <div class="header-actions">
        <NuxtLink class="btn-secondary" to="/" target="_blank">Preview public site</NuxtLink>
        <button class="btn-primary" type="button" @click="openCreate">New banner</button>
      </div>
    </div>

    <div v-if="loading" class="loading-state surface-panel">Loading banners...</div>

    <div v-else class="hero-manager">
      <aside class="banner-card-list surface-panel" aria-labelledby="banner-library-title">
        <div class="section-heading">
          <div>
            <p class="eyebrow">Library</p>
            <h2 id="banner-library-title">Hero library</h2>
          </div>
          <span>{{ banners.length }} banners</span>
        </div>

        <div v-if="!banners.length" class="empty-state">Create a banner to control the public homepage hero.</div>

        <button
          v-for="banner in sortedBanners"
          v-else
          :key="banner.id"
          :class="['banner-card', editing?.id === banner.id ? 'banner-card--selected' : '']"
          type="button"
          @click="openEdit(banner)"
        >
          <img v-if="banner.imageUrl" :src="banner.imageUrl" :alt="banner.imageAltText ?? ''" width="112" height="84" />
          <span v-else class="banner-thumb-fallback" aria-hidden="true">LN</span>

          <span class="banner-card-copy">
            <strong>{{ banner.title }}</strong>
            <small>{{ banner.eyebrow || 'Homepage banner' }}</small>
            <span class="banner-meta-row">
              <span :class="['status-pill', banner.active ? 'status-pill--active' : 'status-pill--inactive']">
                {{ banner.active ? 'Active' : 'Inactive' }}
              </span>
              <span class="order-pill">Order {{ banner.sortOrder }}</span>
            </span>
          </span>
        </button>
      </aside>

      <main class="banner-main">
        <section class="preview-panel surface-panel" aria-labelledby="banner-preview-title">
          <div class="preview-toolbar">
            <div>
              <p class="eyebrow">Live Preview</p>
              <h2 id="banner-preview-title">Homepage hero</h2>
            </div>
            <div class="segmented-control" aria-label="Preview mode">
              <button
                :class="previewMode === 'desktop' ? 'is-active' : ''"
                type="button"
                @click="previewMode = 'desktop'"
              >
                Desktop
              </button>
              <button
                :class="previewMode === 'mobile' ? 'is-active' : ''"
                type="button"
                @click="previewMode = 'mobile'"
              >
                Mobile
              </button>
            </div>
          </div>

          <div :class="['hero-preview', `hero-preview--${previewMode}`]">
            <img v-if="previewImage" :src="previewImage.publicUrl" :alt="previewImage.altText ?? ''" />
            <div v-else class="preview-fallback" aria-hidden="true">LN</div>
            <div class="preview-overlay" aria-hidden="true" />
            <div class="preview-copy">
              <span>{{ form.eyebrow || 'Homepage banner' }}</span>
              <strong>{{ form.title || 'Banner headline' }}</strong>
              <p>{{ form.subtitle || 'Short supporting copy appears here.' }}</p>
              <div class="preview-actions">
                <span class="preview-action-primary">{{ form.primaryLabel || 'Book appointment' }}</span>
                <span v-if="form.secondaryLabel" class="preview-action-secondary">{{ form.secondaryLabel }}</span>
              </div>
            </div>
          </div>
        </section>

        <section class="editor-grid">
          <section class="banner-editor surface-panel" aria-labelledby="banner-editor-title">
            <div class="section-heading">
              <div>
                <p class="eyebrow">Copy</p>
                <h2 id="banner-editor-title">{{ editing ? 'Edit banner' : 'New banner' }}</h2>
              </div>
              <span>{{ form.active ? 'Active' : 'Inactive' }}</span>
            </div>

            <div class="field-grid">
              <label class="field">
                <span>Eyebrow</span>
                <input v-model="form.eyebrow" class="form-control" maxlength="80" placeholder="By appointment only" />
              </label>

              <label class="field">
                <span>Sort order</span>
                <input v-model.number="form.sortOrder" class="form-control" type="number" min="0" step="1" />
              </label>

              <label class="field field-wide">
                <span>Headline</span>
                <input v-model="form.title" class="form-control" required maxlength="140" placeholder="Fresh color, careful detail" />
              </label>

              <label class="field field-wide">
                <span>Description</span>
                <textarea v-model="form.subtitle" class="form-control" rows="4" maxlength="280" placeholder="A short line for the public hero." />
              </label>

              <label class="field">
                <span>Primary label</span>
                <input v-model="form.primaryLabel" class="form-control" required maxlength="48" />
              </label>

              <label class="field">
                <span>Primary link</span>
                <input v-model="form.primaryHref" class="form-control" required maxlength="240" />
              </label>

              <label class="field">
                <span>Secondary label</span>
                <input v-model="form.secondaryLabel" class="form-control" maxlength="48" placeholder="Optional" />
              </label>

              <label class="field">
                <span>Secondary link</span>
                <input v-model="form.secondaryHref" class="form-control" maxlength="240" placeholder="Optional" />
              </label>
            </div>
          </section>

          <aside class="image-panel surface-panel" aria-labelledby="banner-image-title">
            <div class="section-heading">
              <div>
                <p class="eyebrow">Image</p>
                <h2 id="banner-image-title">Pick asset</h2>
              </div>
              <span>Banner + gallery</span>
            </div>

            <form class="banner-upload-form" @submit.prevent="handleBannerImageUpload">
              <label class="upload-drop">
                <span>{{ selectedUploadFileName || 'Choose banner image' }}</span>
                <small>JPEG, PNG, WEBP up to 5 MB</small>
                <input ref="uploadFileInput" type="file" accept="image/jpeg,image/png,image/webp" @change="handleUploadFileChange" />
              </label>

              <label class="field">
                <span>Alt text</span>
                <input v-model="uploadAltText" class="form-control" type="text" placeholder="Describe the banner image" />
              </label>

              <button class="btn-secondary upload-action" type="submit" :disabled="uploadingBannerImage">
                {{ uploadingBannerImage ? 'Uploading...' : 'Upload banner image' }}
              </button>

              <p v-if="uploadError" class="form-error">{{ uploadError }}</p>
            </form>

            <label class="field asset-search">
              <span>Search media</span>
              <input v-model="mediaSearch" class="form-control" type="search" placeholder="Search by alt text or filename" />
            </label>

            <div v-if="!filteredBannerMedia.length" class="empty-state compact-empty">No banner or gallery images match.</div>

            <div v-else class="asset-grid">
              <button
                v-for="asset in filteredBannerMedia"
                :key="asset.id"
                :class="['asset-card', form.imageId === asset.id ? 'asset-card--selected' : '']"
                type="button"
                @click="selectImage(asset)"
              >
                <img :src="asset.publicUrl" :alt="asset.altText ?? ''" width="180" height="120" />
                <span>{{ getMediaLabel(asset) }}</span>
              </button>
            </div>
          </aside>
        </section>

        <section class="publish-bar surface-panel">
          <label class="active-toggle">
            <input v-model="form.active" type="checkbox" />
            <span>Active on public site</span>
          </label>

          <div class="publish-status" aria-live="polite">
            <p v-if="errorMessage" class="form-error">{{ errorMessage }}</p>
            <p v-else-if="saveMessage" class="form-success">{{ saveMessage }}</p>
            <p v-else>Active banner changes update the homepage after saving.</p>
          </div>

          <div class="publish-actions">
            <button v-if="editing" class="btn-secondary" type="button" @click="openCreate">Cancel edit</button>
            <button class="btn-primary" type="button" :disabled="saving" @click="handleSave">
              {{ saving ? 'Saving...' : editing ? 'Save banner' : 'Create banner' }}
            </button>
          </div>
        </section>
      </main>
    </div>
  </AdminShell>
</template>

<script setup lang="ts">
import { resolveRuntimeApiBaseUrl } from '../../utils/api-url'

definePageMeta({
  middleware: 'admin-auth',
  layout: false
})

interface BannerRow {
  id: string
  imageId: string | null
  eyebrow: string
  title: string
  subtitle: string
  primaryLabel: string
  primaryHref: string
  secondaryLabel: string | null
  secondaryHref: string | null
  sortOrder: number
  active: boolean
  imageUrl: string | null
  imageAltText: string | null
}

interface MediaAsset {
  id: string
  publicUrl: string
  altText: string
  usageType: string
}

interface BannerForm {
  imageId: string
  eyebrow: string
  title: string
  subtitle: string
  primaryLabel: string
  primaryHref: string
  secondaryLabel: string
  secondaryHref: string
  sortOrder: number
  active: boolean
}

const config = useRuntimeConfig()
const baseUrl = resolveRuntimeApiBaseUrl(config, import.meta.server)
const requestHeaders = import.meta.server ? useRequestHeaders(['cookie']) : undefined

const banners = ref<BannerRow[]>([])
const media = ref<MediaAsset[]>([])
const loading = ref(true)
const saving = ref(false)
const editing = ref<BannerRow | null>(null)
const saveMessage = ref('')
const errorMessage = ref('')
const previewMode = ref<'desktop' | 'mobile'>('desktop')
const mediaSearch = ref('')
const uploadFileInput = ref<HTMLInputElement>()
const uploadAltText = ref('')
const selectedUploadFileName = ref('')
const uploadingBannerImage = ref(false)
const uploadError = ref('')

const form = reactive<BannerForm>(emptyForm())

const sortedBanners = computed(() =>
  [...banners.value].sort((a, b) => Number(b.active) - Number(a.active) || a.sortOrder - b.sortOrder)
)
const bannerMedia = computed(() =>
  media.value.filter((asset) => ['banner', 'gallery'].includes(asset.usageType))
)
const filteredBannerMedia = computed(() => {
  const query = mediaSearch.value.trim().toLocaleLowerCase()
  if (!query) return bannerMedia.value

  return bannerMedia.value.filter((asset) =>
    [asset.altText, asset.publicUrl, getMediaLabel(asset)].join(' ').toLocaleLowerCase().includes(query)
  )
})
const previewImage = computed(() => media.value.find((asset) => asset.id === form.imageId) ?? null)

function emptyForm(): BannerForm {
  return {
    imageId: '',
    eyebrow: 'By appointment only',
    title: '',
    subtitle: '',
    primaryLabel: 'Book appointment',
    primaryHref: '/booking',
    secondaryLabel: 'View services',
    secondaryHref: '/#services',
    sortOrder: banners.value.length + 1,
    active: true
  }
}

function getMediaLabel(asset: MediaAsset) {
  return `${asset.usageType === 'banner' ? 'Banner' : 'Gallery'} - ${asset.altText || asset.publicUrl.split('/').at(-1)}`
}

async function fetchData() {
  loading.value = true
  try {
    const [bannerRows, mediaRows] = await Promise.all([
      $fetch<BannerRow[]>(`${baseUrl}/admin/banners`, {
        credentials: 'include',
        headers: requestHeaders
      }),
      $fetch<MediaAsset[]>(`${baseUrl}/admin/media`, {
        credentials: 'include',
        headers: requestHeaders
      })
    ])
    banners.value = bannerRows
    media.value = mediaRows
  } finally {
    loading.value = false
  }
}

await fetchData()

function openCreate() {
  editing.value = null
  saveMessage.value = ''
  errorMessage.value = ''
  Object.assign(form, emptyForm())
}

function openEdit(banner: BannerRow) {
  editing.value = banner
  saveMessage.value = ''
  errorMessage.value = ''
  Object.assign(form, {
    imageId: banner.imageId ?? '',
    eyebrow: banner.eyebrow,
    title: banner.title,
    subtitle: banner.subtitle,
    primaryLabel: banner.primaryLabel,
    primaryHref: banner.primaryHref,
    secondaryLabel: banner.secondaryLabel ?? '',
    secondaryHref: banner.secondaryHref ?? '',
    sortOrder: banner.sortOrder,
    active: banner.active
  })
}

function selectImage(asset: MediaAsset) {
  form.imageId = asset.id
  uploadError.value = ''
}

function handleUploadFileChange(event: Event) {
  selectedUploadFileName.value = (event.target as HTMLInputElement).files?.[0]?.name ?? ''
}

function buildUploadAltText(file: File) {
  if (uploadAltText.value.trim()) return uploadAltText.value.trim()
  return file.name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ')
}

async function handleBannerImageUpload() {
  const file = uploadFileInput.value?.files?.[0]
  if (!file) {
    uploadError.value = 'Choose an image before uploading.'
    return
  }

  uploadError.value = ''
  uploadingBannerImage.value = true

  try {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('altText', buildUploadAltText(file))
    formData.append('usageType', 'banner')

    const uploaded = await $fetch<MediaAsset>(`${baseUrl}/admin/media`, {
      method: 'POST',
      credentials: 'include',
      headers: requestHeaders,
      body: formData
    })

    media.value = [uploaded, ...media.value.filter((asset) => asset.id !== uploaded.id)]
    form.imageId = uploaded.id
    selectedUploadFileName.value = ''
    uploadAltText.value = ''
    if (uploadFileInput.value) uploadFileInput.value.value = ''
  } catch (error: any) {
    uploadError.value = error?.data?.error?.message ?? 'Upload failed.'
  } finally {
    uploadingBannerImage.value = false
  }
}

function buildPayload() {
  return {
    imageId: form.imageId || null,
    eyebrow: form.eyebrow,
    title: form.title,
    subtitle: form.subtitle,
    primaryLabel: form.primaryLabel,
    primaryHref: form.primaryHref,
    secondaryLabel: form.secondaryLabel || null,
    secondaryHref: form.secondaryHref || null,
    sortOrder: Number(form.sortOrder) || 0,
    active: form.active
  }
}

async function handleSave() {
  saving.value = true
  saveMessage.value = ''
  errorMessage.value = ''

  try {
    const path = editing.value ? `/admin/banners/${editing.value.id}` : '/admin/banners'
    await $fetch(`${baseUrl}${path}`, {
      method: editing.value ? 'PATCH' : 'POST',
      credentials: 'include',
      headers: requestHeaders,
      body: buildPayload()
    })
    const message = editing.value ? 'Banner updated.' : 'Banner created.'
    await fetchData()
    openCreate()
    saveMessage.value = message
  } catch (error: any) {
    errorMessage.value = error?.data?.error?.message ?? 'Could not save banner.'
  } finally {
    saving.value = false
  }
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

.admin-page-header h1 {
  margin: 0.3rem 0 0;
  font-size: clamp(2rem, 5vw, 3.4rem);
}

.admin-page-header p:not(.eyebrow) {
  color: var(--color-muted);
  margin: 0.4rem 0 0;
}

.header-actions,
.publish-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
}

.hero-manager {
  display: grid;
  grid-template-columns: minmax(280px, 360px) minmax(0, 1fr);
  gap: 1rem;
  align-items: start;
}

.banner-card-list,
.preview-panel,
.banner-editor,
.image-panel,
.publish-bar {
  padding: 1rem;
}

.banner-card-list {
  display: grid;
  gap: 0.75rem;
}

.section-heading,
.preview-toolbar,
.publish-bar {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}

.section-heading h2,
.preview-toolbar h2 {
  margin: 0.2rem 0 0;
  font-size: 1.35rem;
}

.section-heading > span,
.preview-toolbar > span {
  color: var(--color-muted);
  font-size: 0.85rem;
  font-weight: 800;
}

.banner-card {
  display: grid;
  grid-template-columns: 5.5rem minmax(0, 1fr);
  gap: 0.75rem;
  width: 100%;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-card);
  background: var(--color-surface-strong);
  color: inherit;
  cursor: pointer;
  padding: 0.65rem;
  text-align: left;
}

.banner-card--selected {
  border-color: var(--color-primary);
  box-shadow: inset 4px 0 0 var(--color-primary);
}

.banner-card img,
.banner-thumb-fallback {
  width: 5.5rem;
  aspect-ratio: 4 / 3;
  border-radius: 6px;
  object-fit: cover;
}

.banner-thumb-fallback,
.preview-fallback {
  display: grid;
  place-items: center;
  background: #c89686;
  color: #fff;
  font-family: Georgia, "Times New Roman", serif;
  font-weight: 900;
}

.banner-card-copy {
  display: grid;
  align-content: center;
  min-width: 0;
}

.banner-card-copy strong,
.asset-card span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.banner-card-copy strong {
  color: var(--color-ink);
  font-size: 0.95rem;
  line-height: 1.25;
}

.banner-card-copy small {
  color: var(--color-muted);
  font-size: 0.8rem;
  font-weight: 700;
  margin-top: 0.25rem;
}

.banner-meta-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
  margin-top: 0.55rem;
}

.status-pill,
.order-pill {
  display: inline-flex;
  justify-content: center;
  border-radius: 999px;
  padding: 0.28rem 0.65rem;
  font-size: 0.72rem;
  font-weight: 800;
}

.status-pill--active {
  background: #e6f0e7;
  color: var(--color-success);
}

.status-pill--inactive,
.order-pill {
  background: #ede9e3;
  color: var(--color-muted);
}

.banner-main {
  display: grid;
  gap: 1rem;
}

.preview-panel {
  overflow: hidden;
  padding: 0;
}

.preview-toolbar {
  border-bottom: 1px solid var(--color-border);
  padding: 1rem;
}

.segmented-control {
  display: inline-grid;
  grid-template-columns: 1fr 1fr;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-card);
  overflow: hidden;
}

.segmented-control button {
  min-height: 2.55rem;
  border: 0;
  border-radius: 0;
  background: transparent;
  color: var(--color-muted);
  font-weight: 900;
  padding: 0 0.9rem;
}

.segmented-control .is-active {
  background: var(--color-primary);
  color: #fff;
}

.hero-preview {
  position: relative;
  display: grid;
  align-items: end;
  min-height: 25rem;
  overflow: hidden;
  background: #2b211d;
}

.hero-preview--mobile {
  max-width: 24rem;
  min-height: 34rem;
  margin: 1rem auto;
  border-radius: var(--radius-card);
}

.hero-preview img,
.preview-fallback,
.preview-overlay {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.hero-preview img {
  object-fit: cover;
}

.preview-overlay {
  background:
    linear-gradient(90deg, rgba(20, 14, 11, 0.74), rgba(20, 14, 11, 0.32) 52%, rgba(20, 14, 11, 0.14)),
    linear-gradient(180deg, rgba(20, 14, 11, 0.08), rgba(20, 14, 11, 0.64));
}

.preview-copy {
  position: relative;
  z-index: 1;
  max-width: 40rem;
  padding: 3rem;
  color: #fff;
}

.hero-preview--mobile .preview-copy {
  padding: 2rem 1.25rem;
}

.preview-copy span:first-child {
  display: block;
  color: #f9d9d3;
  font-size: 0.72rem;
  font-weight: 900;
  letter-spacing: 0.14em;
  margin-bottom: 0.85rem;
  text-transform: uppercase;
}

.preview-copy strong {
  display: block;
  font-family: Georgia, "Times New Roman", serif;
  font-size: clamp(2.4rem, 5vw, 4.6rem);
  line-height: 0.98;
}

.hero-preview--mobile .preview-copy strong {
  font-size: 2.65rem;
}

.preview-copy p {
  color: rgba(255, 255, 255, 0.86);
  line-height: 1.65;
  margin: 1rem 0 0;
}

.preview-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.65rem;
  margin-top: 1.5rem;
}

.preview-actions span {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 2.75rem;
  border: 1px solid currentColor;
  padding: 0 1rem;
  font-size: 0.72rem;
  font-weight: 900;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.preview-action-primary {
  background: #fff;
  color: var(--color-ink);
}

.preview-action-secondary {
  color: #fff;
}

.editor-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.08fr) minmax(290px, 0.92fr);
  gap: 1rem;
}

.banner-editor,
.image-panel {
  display: grid;
  gap: 1rem;
}

.field-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.75rem;
}

.field-wide {
  grid-column: 1 / -1;
}

.field,
.active-toggle {
  display: grid;
  gap: 0.35rem;
}

.field > span,
.active-toggle {
  color: var(--color-ink-soft);
  font-size: 0.85rem;
  font-weight: 800;
}

.banner-upload-form {
  display: grid;
  gap: 0.75rem;
  border: 1px dashed var(--color-accent);
  border-radius: var(--radius-card);
  background: rgba(255, 250, 244, 0.72);
  padding: 0.85rem;
}

.upload-drop {
  display: grid;
  gap: 0.25rem;
  min-height: 6.5rem;
  cursor: pointer;
  place-items: center;
  text-align: center;
}

.upload-drop span {
  color: var(--color-primary);
  font-weight: 900;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.upload-drop small {
  color: var(--color-muted);
  font-weight: 800;
}

.upload-drop input {
  position: absolute;
  width: 1px;
  height: 1px;
  opacity: 0;
  pointer-events: none;
}

.upload-action {
  width: 100%;
}

.asset-search {
  margin-top: 0.2rem;
}

.asset-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.65rem;
  max-height: 24rem;
  overflow: auto;
  padding-right: 0.15rem;
}

.asset-card {
  display: grid;
  gap: 0.45rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-card);
  background: var(--color-surface-strong);
  color: inherit;
  cursor: pointer;
  padding: 0.45rem;
  text-align: left;
}

.asset-card--selected {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(141, 88, 70, 0.14);
}

.asset-card img {
  width: 100%;
  aspect-ratio: 4 / 3;
  border-radius: 6px;
  object-fit: cover;
}

.asset-card span {
  color: var(--color-ink-soft);
  font-size: 0.75rem;
  font-weight: 800;
}

.compact-empty {
  min-height: 5rem;
}

.publish-bar {
  align-items: center;
}

.active-toggle {
  min-height: 3rem;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: center;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-card);
  padding: 0.75rem;
}

.publish-status {
  color: var(--color-muted);
  font-size: 0.9rem;
  font-weight: 700;
  min-width: 0;
}

.publish-status p,
.form-error,
.form-success {
  margin: 0;
}

.form-error,
.form-success {
  font-size: 0.85rem;
  font-weight: 800;
}

.form-error {
  color: var(--color-danger);
}

.form-success {
  color: var(--color-success);
}

@media (max-width: 1180px) {
  .hero-manager,
  .editor-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 760px) {
  .admin-page-header,
  .header-actions,
  .section-heading,
  .preview-toolbar,
  .publish-bar,
  .publish-actions {
    align-items: stretch;
    flex-direction: column;
  }

  .field-grid,
  .asset-grid {
    grid-template-columns: 1fr;
  }

  .preview-copy {
    padding: 2rem 1.25rem;
  }

  .hero-preview {
    min-height: 32rem;
  }

  .preview-actions,
  .preview-actions span,
  .header-actions > *,
  .publish-actions > * {
    width: 100%;
  }
}
</style>
