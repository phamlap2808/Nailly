<template>
  <AdminShell>
    <div class="admin-page-header">
      <div>
        <p class="eyebrow">Assets</p>
        <h1 class="display-title">Media</h1>
        <p>Curate the imagery used across the public site and service catalog.</p>
      </div>
    </div>

    <div v-if="loading" class="loading-state surface-panel">Loading media...</div>

    <div v-else class="media-workspace">
      <aside class="upload-rail surface-panel" aria-label="Upload media">
        <div>
          <p class="eyebrow">Upload</p>
          <h2>New asset</h2>
          <p>Add imagery for banners, gallery, service, or staff use.</p>
        </div>

        <form class="upload-form" @submit.prevent="handleUpload">
          <label class="file-drop">
            <span class="file-drop-title">{{ selectedFileName || 'Choose image' }}</span>
            <span class="file-drop-meta">JPEG, PNG, WEBP up to 5 MB</span>
            <input ref="fileInput" type="file" accept="image/jpeg,image/png,image/webp" required @change="handleFileChange" />
          </label>

          <label class="field">
            <span>Alt text</span>
            <input v-model="altText" class="form-control" type="text" placeholder="Describe the image" />
          </label>

          <label class="field">
            <span>Usage</span>
            <select v-model="usageType" class="form-control">
              <option value="gallery">Gallery</option>
              <option value="banner">Banner</option>
              <option value="service">Service</option>
              <option value="staff">Staff</option>
            </select>
          </label>

          <button type="submit" class="btn-primary upload-btn" :disabled="uploading">
            {{ uploading ? 'Uploading...' : 'Upload asset' }}
          </button>

          <div v-if="uploadError" class="upload-error">{{ uploadError }}</div>
        </form>
      </aside>

      <section class="media-library surface-panel">
        <div class="library-header">
          <div>
            <p class="eyebrow">Library</p>
            <h2>All media</h2>
            <p>{{ mediaList.length }} assets in the library.</p>
          </div>
        </div>

        <div class="media-toolbar" aria-label="Media filters">
          <label class="filter-field search-field">
            <span>Search</span>
            <input
              v-model="searchQuery"
              class="form-control"
              type="search"
              placeholder="Search filename, usage, or alt text"
            />
          </label>
          <label class="filter-field">
            <span>Usage</span>
            <select v-model="usageFilter" class="form-control">
              <option value="all">All</option>
              <option value="gallery">Gallery</option>
              <option value="banner">Banner</option>
              <option value="service">Service</option>
              <option value="staff">Staff</option>
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

        <div v-if="!filteredMediaList.length" class="empty-state">
          {{ mediaList.length ? 'No media match the current filters.' : 'Uploaded media will appear here.' }}
        </div>

        <template v-else>
          <div class="media-table" role="table" aria-label="Media library">
            <div class="media-table-head" role="row">
              <span>Asset</span>
              <span>Usage</span>
              <span>Size</span>
              <span>Alt status</span>
              <span>Alt text</span>
              <span>State</span>
            </div>

            <div v-for="item in paginatedMediaList" :key="item.id" class="media-row" role="row">
              <div class="asset-cell">
                <NuxtImg :src="item.publicUrl" :alt="item.altText ?? ''" width="120" height="90" class="media-thumb" />
                <div class="asset-copy">
                  <div class="asset-name">{{ getMediaFilename(item) }}</div>
                  <p>{{ item.publicUrl }}</p>
                </div>
              </div>

              <div class="data-cell">
                <span class="row-label">Usage</span>
                <span :class="['usage-pill', `usage-pill--${item.usageType}`]">{{ getUsageLabel(item.usageType) }}</span>
              </div>

              <div class="data-cell media-size-cell">
                <span class="row-label">Size</span>
                <span>{{ formatMediaBytes(item.sizeBytes) }}</span>
              </div>

              <div class="data-cell">
                <span class="row-label">Alt status</span>
                <span :class="['status-pill', getAltStatus(item.altText) === 'Ready' ? 'status-pill--ready' : 'status-pill--missing']">
                  {{ getAltStatus(item.altText) }}
                </span>
              </div>

              <label class="row-alt-field">
                <span class="row-label">Alt text</span>
                <input
                  :value="item.altText ?? ''"
                  class="form-control"
                  type="text"
                  placeholder="Add alt text"
                  @change="handleAltChange(item.id, $event)"
                />
              </label>

              <div class="data-cell save-state-cell">
                <span class="row-label">State</span>
                <span :class="['save-state', `save-state--${rowSaveState[item.id] ?? 'idle'}`]">
                  {{ getSaveStateLabel(rowSaveState[item.id]) }}
                </span>
              </div>
            </div>
          </div>

          <div class="pagination-bar" aria-label="Media pagination">
            <span>{{ paginationSummary }}</span>
            <div class="pagination-actions">
              <button
                class="btn-secondary"
                type="button"
                :disabled="mediaPage.currentPage <= 1"
                @click="goToPage(mediaPage.currentPage - 1)"
              >
                Previous
              </button>
              <span class="page-indicator">Page {{ mediaPage.currentPage }} of {{ mediaPage.totalPages }}</span>
              <button
                class="btn-secondary"
                type="button"
                :disabled="mediaPage.currentPage >= mediaPage.totalPages"
                @click="goToPage(mediaPage.currentPage + 1)"
              >
                Next
              </button>
            </div>
          </div>
        </template>
      </section>
    </div>
  </AdminShell>
</template>

<script setup lang="ts">
import type { MediaUsageFilter } from '../../utils/admin-media-library'
import {
  filterMediaAssets,
  formatMediaBytes,
  getAltStatus,
  getMediaFilename,
  getUsageLabel,
  paginateMediaAssets
} from '../../utils/admin-media-library'
import { resolveRuntimeApiBaseUrl } from '../../utils/api-url'

definePageMeta({
  middleware: 'admin-auth',
  layout: false
})

type UploadUsage = Exclude<MediaUsageFilter, 'all'>
type RowSaveState = 'idle' | 'saving' | 'saved' | 'error'

interface MediaAsset {
  id: string
  publicUrl: string
  altText: string
  usageType: string
  sizeBytes: number
}

const config = useRuntimeConfig()
const baseUrl = resolveRuntimeApiBaseUrl(config, import.meta.server)
const requestHeaders = import.meta.server ? useRequestHeaders(['cookie']) : undefined

const fileInput = ref<HTMLInputElement>()
const mediaList = ref<MediaAsset[]>([])
const loading = ref(true)
const altText = ref('')
const usageType = ref<UploadUsage>('gallery')
const uploading = ref(false)
const uploadError = ref('')
const selectedFileName = ref('')
const searchQuery = ref('')
const usageFilter = ref<MediaUsageFilter>('all')
const pageSize = ref(5)
const currentPage = ref(1)
const rowSaveState = reactive<Record<string, RowSaveState>>({})

async function fetchMedia() {
  loading.value = true
  try {
    mediaList.value = await $fetch<MediaAsset[]>(`${baseUrl}/admin/media`, {
      credentials: 'include',
      headers: requestHeaders
    })
  } finally {
    loading.value = false
  }
}

await fetchMedia()

const filteredMediaList = computed(() =>
  filterMediaAssets(mediaList.value, {
    searchQuery: searchQuery.value,
    usage: usageFilter.value
  })
)
const mediaPage = computed(() => paginateMediaAssets(filteredMediaList.value, currentPage.value, pageSize.value))
const paginatedMediaList = computed(() => mediaPage.value.items)
const paginationSummary = computed(() => {
  if (!mediaPage.value.totalItems) return '0 media'

  return `${mediaPage.value.startItem}-${mediaPage.value.endItem} of ${mediaPage.value.totalItems} media`
})

watch([searchQuery, usageFilter, pageSize], () => {
  currentPage.value = 1
})

watch(mediaPage, (nextPage) => {
  if (currentPage.value !== nextPage.currentPage) {
    currentPage.value = nextPage.currentPage
  }
})

function handleFileChange(event: Event) {
  selectedFileName.value = (event.target as HTMLInputElement).files?.[0]?.name ?? ''
}

function goToPage(page: number) {
  currentPage.value = page
}

function getSaveStateLabel(state: RowSaveState | undefined) {
  if (state === 'saving') return 'Saving'
  if (state === 'saved') return 'Saved'
  if (state === 'error') return 'Error'
  return 'Idle'
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
      headers: requestHeaders,
      body: formData
    })

    if (fileInput.value) fileInput.value.value = ''
    selectedFileName.value = ''
    altText.value = ''
    usageType.value = 'gallery'
    await fetchMedia()
  } catch (e: any) {
    uploadError.value = e?.data?.error?.message ?? 'Upload failed.'
  } finally {
    uploading.value = false
  }
}

async function handleAltChange(id: string, event: Event) {
  const value = (event.target as HTMLInputElement).value
  rowSaveState[id] = 'saving'

  try {
    await $fetch(`${baseUrl}/admin/media/${id}`, {
      method: 'PATCH',
      credentials: 'include',
      headers: requestHeaders,
      body: { altText: value }
    })
    const item = mediaList.value.find((asset) => asset.id === id)
    if (item) item.altText = value
    rowSaveState[id] = 'saved'
  } catch {
    rowSaveState[id] = 'error'
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

.media-workspace {
  display: grid;
  grid-template-columns: minmax(280px, 340px) minmax(0, 1fr);
  gap: 1rem;
  align-items: start;
}

.upload-rail,
.media-library {
  padding: 1rem;
}

.upload-rail {
  display: grid;
  gap: 1rem;
  position: sticky;
  top: 1rem;
}

.upload-rail h2,
.library-header h2 {
  margin: 0.2rem 0 0;
  font-size: 1.35rem;
}

.upload-rail p:not(.eyebrow),
.library-header p:not(.eyebrow) {
  color: var(--color-muted);
  margin: 0.35rem 0 0;
}

.upload-form,
.media-library {
  display: grid;
  gap: 1rem;
}

.field,
.filter-field,
.row-alt-field {
  display: grid;
  gap: 0.35rem;
}

.field > span,
.filter-field > span,
.row-label {
  color: var(--color-ink-soft);
  font-size: 0.85rem;
  font-weight: 700;
}

.file-drop {
  display: grid;
  gap: 0.25rem;
  min-height: 8.5rem;
  border: 1px dashed var(--color-accent);
  border-radius: var(--radius-card);
  background: rgba(255, 250, 244, 0.72);
  color: var(--color-muted);
  cursor: pointer;
  justify-items: center;
  align-content: center;
  padding: 1rem;
  text-align: center;
}

.file-drop-title {
  color: var(--color-primary);
  font-weight: 900;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-drop-meta {
  font-size: 0.82rem;
  font-weight: 700;
}

.file-drop input {
  position: absolute;
  width: 1px;
  height: 1px;
  opacity: 0;
  pointer-events: none;
}

.upload-btn {
  width: 100%;
}

.upload-error {
  color: var(--color-danger);
  font-size: 0.85rem;
  font-weight: 700;
}

.library-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}

.media-toolbar {
  display: grid;
  grid-template-columns: minmax(220px, 1fr) minmax(140px, 180px) minmax(110px, 130px);
  gap: 0.75rem;
  align-items: end;
}

.media-table {
  display: grid;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-card);
  overflow: hidden;
}

.media-table-head,
.media-row {
  display: grid;
  grid-template-columns: minmax(250px, 1.4fr) 100px 80px 105px minmax(180px, 1fr) 72px;
  gap: 0.85rem;
  align-items: center;
  padding: 0.85rem 1rem;
}

.media-table-head {
  background: rgba(239, 226, 214, 0.55);
  color: var(--color-muted);
  font-size: 0.75rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.media-row {
  border-top: 1px solid var(--color-border);
  background: var(--color-surface-strong);
}

.asset-cell {
  display: grid;
  grid-template-columns: 4.5rem minmax(0, 1fr);
  gap: 0.75rem;
  align-items: center;
  min-width: 0;
}

.media-thumb {
  width: 4.5rem;
  aspect-ratio: 4 / 3;
  height: auto;
  border-radius: 6px;
  background: var(--color-bg-strong);
  object-fit: cover;
}

.asset-copy {
  min-width: 0;
}

.asset-name {
  color: var(--color-ink);
  font-weight: 900;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.asset-copy p {
  color: var(--color-muted);
  font-size: 0.82rem;
  line-height: 1.35;
  margin: 0.18rem 0 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.data-cell {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-width: 0;
}

.media-size-cell,
.save-state-cell {
  color: var(--color-ink-soft);
  font-weight: 800;
}

.usage-pill,
.status-pill,
.save-state {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 1.6rem;
  border-radius: 999px;
  padding: 0.2rem 0.65rem;
  font-size: 0.74rem;
  font-weight: 800;
  white-space: nowrap;
}

.usage-pill {
  background: #f0e6dc;
  color: var(--color-ink-soft);
}

.usage-pill--gallery {
  background: #f4ded4;
  color: #8a4f3a;
}

.usage-pill--banner {
  background: #f8dcd5;
  color: #8a4f3a;
}

.usage-pill--service {
  background: #efe2d6;
  color: var(--color-primary);
}

.usage-pill--staff {
  background: #e6f0e7;
  color: var(--color-success);
}

.status-pill--ready,
.save-state--saved {
  background: #e6f0e7;
  color: var(--color-success);
}

.status-pill--missing,
.save-state--error {
  background: #f4ded4;
  color: var(--color-danger);
}

.save-state--idle {
  background: #ede9e3;
  color: var(--color-muted);
}

.save-state--saving {
  background: #f5e7d7;
  color: #8a5635;
}

.row-label {
  display: none;
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
  .media-workspace {
    grid-template-columns: 1fr;
  }

  .upload-rail {
    position: static;
  }

  .media-toolbar {
    grid-template-columns: 1fr 1fr;
  }

  .search-field {
    grid-column: 1 / -1;
  }

  .media-table-head {
    display: none;
  }

  .media-row {
    grid-template-columns: 1fr;
    gap: 0.75rem;
  }

  .asset-cell {
    grid-template-columns: 5.5rem minmax(0, 1fr);
  }

  .media-thumb {
    width: 5.5rem;
  }

  .data-cell,
  .row-alt-field {
    display: grid;
    grid-template-columns: 7rem minmax(0, 1fr);
    align-items: center;
  }

  .row-label {
    display: inline;
  }
}

@media (max-width: 640px) {
  .admin-page-header,
  .media-toolbar,
  .pagination-bar,
  .pagination-actions,
  .data-cell,
  .row-alt-field {
    display: grid;
    grid-template-columns: 1fr;
  }

  .asset-cell {
    grid-template-columns: 1fr;
  }

  .media-thumb {
    width: 100%;
    max-height: 12rem;
  }

  .pagination-actions button {
    width: 100%;
  }
}
</style>
