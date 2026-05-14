<template>
  <AdminShell>
    <div class="admin-page-header">
      <div>
        <p class="eyebrow">Assets</p>
        <h1 class="display-title">Media</h1>
        <p>Curate the imagery used across the public site and service catalog.</p>
      </div>
    </div>

    <form class="upload-form surface-panel" @submit.prevent="handleUpload">
      <div class="upload-row">
        <label class="file-field">
          <span>Image</span>
          <input ref="fileInput" type="file" accept="image/jpeg,image/png,image/webp" required />
        </label>
        <label class="field">
          <span>Alt text</span>
          <input v-model="altText" class="form-control" type="text" />
        </label>
        <label class="field usage-field">
          <span>Usage</span>
          <select v-model="usageType" class="form-control">
            <option value="gallery">Gallery</option>
            <option value="service">Service</option>
            <option value="staff">Staff</option>
          </select>
        </label>
        <button type="submit" class="btn-primary" :disabled="uploading">
          {{ uploading ? 'Uploading...' : 'Upload' }}
        </button>
      </div>
      <div v-if="uploadError" class="upload-error">{{ uploadError }}</div>
    </form>

    <div v-if="loading" class="loading-state surface-panel">Loading media...</div>

    <div v-else class="media-grid">
      <article v-for="item in mediaList" :key="item.id" class="media-card surface-panel">
        <NuxtImg :src="item.publicUrl" :alt="item.altText ?? ''" width="420" height="300" class="media-img" />
        <div class="media-meta">
          <div class="media-row">
            <span class="media-type">{{ formatUsage(item.usageType) }}</span>
            <span class="media-size">{{ formatBytes(item.sizeBytes) }}</span>
          </div>
          <label class="meta-field">
            <span>Alt text</span>
            <input
              :value="item.altText ?? ''"
              class="form-control"
              @change="handleAltChange(item.id, $event)"
            />
          </label>
        </div>
      </article>
    </div>
  </AdminShell>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: 'admin-auth',
  layout: false
})

interface MediaAsset {
  id: string
  publicUrl: string
  altText: string
  usageType: string
  sizeBytes: number
}

const config = useRuntimeConfig()
const baseUrl = config.public.apiBaseUrl

const fileInput = ref<HTMLInputElement>()
const mediaList = ref<MediaAsset[]>([])
const loading = ref(true)
const altText = ref('')
const usageType = ref('gallery')
const uploading = ref(false)
const uploadError = ref('')

async function fetchMedia() {
  loading.value = true
  try {
    mediaList.value = await $fetch<MediaAsset[]>(`${baseUrl}/admin/media`, { credentials: 'include' })
  } finally {
    loading.value = false
  }
}

await fetchMedia()

function formatUsage(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1)
}

function formatBytes(value: number) {
  if (!Number.isFinite(value)) return ''
  if (value < 1024 * 1024) return `${Math.round(value / 1024)} KB`
  return `${(value / 1024 / 1024).toFixed(1)} MB`
}

async function handleUpload() {
  const file = fileInput.value?.files?.[0]
  if (!file) return

  uploadError.value = ''
  uploading.value = true
  try {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('altText', altText.value)
    formData.append('usageType', usageType.value)

    await $fetch(`${baseUrl}/admin/media`, {
      method: 'POST',
      credentials: 'include',
      body: formData
    })

    if (fileInput.value) fileInput.value.value = ''
    altText.value = ''
    await fetchMedia()
  } catch (e: any) {
    uploadError.value = e?.data?.error?.message ?? 'Upload failed.'
  } finally {
    uploading.value = false
  }
}

async function handleAltChange(id: string, event: Event) {
  const value = (event.target as HTMLInputElement).value
  await $fetch(`${baseUrl}/admin/media/${id}`, {
    method: 'PATCH',
    credentials: 'include',
    body: { altText: value }
  })
  const item = mediaList.value.find((asset) => asset.id === id)
  if (item) item.altText = value
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

.upload-form {
  padding: 1rem;
  margin-bottom: 1.25rem;
}

.upload-row {
  display: grid;
  grid-template-columns: minmax(220px, 1.4fr) minmax(180px, 1fr) minmax(140px, 0.7fr) auto;
  gap: 0.75rem;
  align-items: end;
}

.field,
.file-field,
.meta-field {
  display: grid;
  gap: 0.35rem;
}

.field span,
.file-field span,
.meta-field span {
  color: var(--color-ink-soft);
  font-size: 0.85rem;
  font-weight: 700;
}

.file-field input {
  width: 100%;
  min-height: 2.65rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-card);
  background: var(--color-surface-strong);
  color: var(--color-muted);
  padding: 0.55rem 0.75rem;
}

.upload-error {
  color: var(--color-danger);
  font-size: 0.85rem;
  font-weight: 700;
  margin-top: 0.75rem;
}

.media-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 1rem;
}

.media-card {
  overflow: hidden;
}

.media-img {
  width: 100%;
  aspect-ratio: 4 / 3;
  height: auto;
  object-fit: cover;
  display: block;
  background: var(--color-bg-strong);
}

.media-meta {
  display: grid;
  gap: 0.75rem;
  padding: 0.85rem;
}

.media-row {
  display: flex;
  justify-content: space-between;
  gap: 0.75rem;
  align-items: center;
}

.media-type {
  color: var(--color-primary);
  font-size: 0.78rem;
  font-weight: 900;
  text-transform: uppercase;
}

.media-size {
  color: var(--color-muted);
  font-size: 0.78rem;
  font-weight: 700;
}

.loading-state {
  color: var(--color-muted);
  padding: 2rem;
}

@media (max-width: 820px) {
  .upload-row {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .upload-row .btn-primary {
    width: 100%;
  }
}

@media (max-width: 560px) {
  .admin-page-header,
  .upload-row {
    display: grid;
    grid-template-columns: 1fr;
  }
}
</style>
