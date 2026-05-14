<template>
  <div class="gallery-grid">
    <NuxtImg
      v-for="(item, index) in images"
      :key="item.publicUrl"
      :src="item.publicUrl"
      :alt="item.altText ?? ''"
      :class="['gallery-img', { 'gallery-img--feature': index === 0 }]"
      width="720"
      height="720"
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
  grid-template-columns: repeat(3, minmax(0, 1fr));
  grid-auto-flow: dense;
  gap: 0.8rem;
}

.gallery-img {
  width: 100%;
  height: 100%;
  min-height: 15rem;
  aspect-ratio: 1 / 1;
  border-radius: var(--radius-media);
  object-fit: cover;
  box-shadow: var(--shadow-soft);
}

.gallery-img--feature {
  grid-column: span 2;
  grid-row: span 2;
}

@media (max-width: 820px) {
  .gallery-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 560px) {
  .gallery-grid {
    grid-template-columns: 1fr;
  }

  .gallery-img,
  .gallery-img--feature {
    grid-column: auto;
    grid-row: auto;
    min-height: 17rem;
  }
}
</style>
