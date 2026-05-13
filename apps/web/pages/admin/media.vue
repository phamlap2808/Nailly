<template>
  <AdminShell>
    <div class="page-header">
      <h1 class="page-heading">Media</h1>
    </div>

    <!-- Upload form -->
    <form class="upload-form" @submit.prevent="handleUpload">
      <div class="upload-row">
        <input ref="fileInput" type="file" accept="image/jpeg,image/png,image/webp" required />
        <input v-model="altText" type="text" placeholder="Alt text" />
        <select v-model="usageType">
          <option value="gallery">Gallery</option>
          <option value="service">Service</option>
          <option value="staff">Staff</option>
        </select>
        <button type="submit" class="btn-primary" :disabled="uploading">
          {{ uploading ? 'Uploading...' : 'Upload' }}
        </button>
      </div>
      <div v-if="uploadError" class="upload-error">{{ uploadError }}</div>
    </form>

    <!-- Gallery -->
    <div v-if="loading" class="loading-state">Loading...</div>
    <div v-else class="media-grid">
      <div v-for="item in mediaList" :key="item.id" class="media-card">
        <NuxtImg :src="item.publicUrl" :alt="item.altText ?? ''" width="200" height="150" class="media-img" />
        <div class="media-meta">
          <input
            :value="item.altText ?? ''"
            placeholder="Alt text"
            class="meta-input"
            @change="(e) => handleUpdate(item.id, (e.target as HTMLInputElement).value)"
          />
          <span class="media-type">{{ item.usageType }}</span>
        </div>
      </div>
    </div>
  </AdminShell>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: 'admin-auth',
  layout: false
})

const config = useRuntimeConfig()
const baseUrl = config.public.apiBaseUrl

const fileInput = ref<HTMLInputElement>()
const mediaList = ref<any[]>([])
const loading = ref(true)
const altText = ref('')
const usageType = ref('gallery')
const uploading = ref(false)
const uploadError = ref('')

async function fetchMedia() {
  loading.value = true
  try {
    mediaList.value = await $fetch(`${baseUrl}/admin/media`, { credentials: 'include' })
  } finally {
    loading.value = false
  }
}

await fetchMedia()

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

async function handleUpdate(id: string, altText: string) {
  await $fetch(`${baseUrl}/admin/media/${id}`, {
    method: 'PATCH',
    credentials: 'include',
    body: { altText }
  })
}
</script>

<style scoped>
.page-header { margin-bottom: 1.5rem; }
.page-heading { font-size: 1.5rem; font-weight: 700; margin: 0; }
.upload-form { background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-card); padding: 1.25rem; margin-bottom: 2rem; }
.upload-row { display: flex; gap: 0.75rem; align-items: center; flex-wrap: wrap; }
.upload-row input[type="file"] { font-size: 0.85rem; }
.upload-row input[type="text"], .upload-row select { padding: 0.4rem 0.5rem; border: 1px solid var(--color-border); border-radius: 4px; font-size: 0.85rem; }
.btn-primary { padding: 0.5rem 1rem; background: var(--color-primary); color: #fff; border: none; border-radius: 6px; font-weight: 600; font-size: 0.85rem; cursor: pointer; }
.btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
.upload-error { color: #dc2626; font-size: 0.8rem; margin-top: 0.5rem; }
.media-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 1rem; }
.media-card { background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-card); overflow: hidden; }
.media-img { width: 100%; height: 150px; object-fit: cover; display: block; }
.media-meta { padding: 0.6rem; display: flex; gap: 0.5rem; align-items: center; }
.meta-input { flex: 1; padding: 0.3rem 0.5rem; border: 1px solid var(--color-border); border-radius: 4px; font-size: 0.8rem; min-width: 0; }
.media-type { font-size: 0.7rem; color: var(--color-muted); text-transform: uppercase; white-space: nowrap; }
.loading-state { color: var(--color-muted); text-align: center; padding: 3rem; }
</style>
