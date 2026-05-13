<template>
  <div class="gallery-grid">
    <NuxtImg
      v-for="item in images"
      :key="item.publicUrl"
      :src="item.publicUrl"
      :alt="item.altText ?? ''"
      class="gallery-img"
      width="400"
      height="300"
      loading="lazy"
    />
  </div>
</template>

<script setup lang="ts">
defineProps<{
  images: Array<{ publicUrl: string; altText: string | null }>
}>()
</script>

<style scoped>
.gallery-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 1rem;
}

.gallery-img {
  width: 100%;
  height: 240px;
  object-fit: cover;
  border-radius: var(--radius-card);
}
</style>
