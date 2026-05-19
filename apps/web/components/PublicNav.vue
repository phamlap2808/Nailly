<template>
  <header class="public-nav">
    <div class="client-announcement">
      <span>By appointment only</span>
      <strong>Book online for your next visit</strong>
    </div>

    <div class="container nav-shell">
      <NuxtLink to="/" class="client-wordmark" :aria-label="`${resolvedShopName} home`">
        <span class="wordmark-mark">{{ brandInitials }}</span>
        <span class="wordmark-text">{{ resolvedShopName }}</span>
      </NuxtLink>

      <NuxtLink to="/booking" class="nav-book-pill">Book</NuxtLink>
    </div>

    <nav class="container nav-links" aria-label="Public navigation">
      <div class="nav-links-inner">
        <NuxtLink
          v-for="item in publicNavItems"
          :key="item.to"
          :to="item.to"
          :class="{ 'nav-cta': item.cta }"
        >
          {{ item.label }}
        </NuxtLink>
      </div>
    </nav>

    <div class="container client-quick-actions" aria-label="Quick actions">
      <NuxtLink to="/booking">Book</NuxtLink>
      <NuxtLink to="/#services">Services</NuxtLink>
      <NuxtLink to="/#gallery">Gallery</NuxtLink>
    </div>
  </header>
</template>

<script setup lang="ts">
import { publicNavItems } from '../utils/public-nav'
import { resolveShopName, shopInitials } from '../utils/shop-brand'

const props = defineProps<{
  shopName?: string | null
}>()

const resolvedShopName = computed(() => resolveShopName(props.shopName))
const brandInitials = computed(() => shopInitials(resolvedShopName.value))
</script>

<style scoped>
.public-nav {
  position: sticky;
  top: 0;
  z-index: 50;
  border-bottom: 1px solid #eadbd2;
  background: rgba(255, 252, 248, 0.96);
  backdrop-filter: blur(14px);
}

.client-announcement {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.7rem;
  min-height: 2rem;
  padding: 0.35rem 1rem;
  background: #f7d9d2;
  color: #2b211d;
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.15em;
  text-align: center;
  text-transform: uppercase;
}

.client-announcement strong {
  font-weight: 800;
}

.nav-shell {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
  align-items: center;
  gap: 0.9rem;
  min-height: 4.8rem;
}

.nav-book-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.client-wordmark {
  grid-column: 2;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.8rem;
  min-width: 0;
  color: var(--color-ink);
  text-decoration: none;
}

.wordmark-mark {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.2rem;
  height: 2.2rem;
  flex: 0 0 auto;
  border: 1px solid rgba(43, 33, 29, 0.78);
  border-radius: 50%;
  background: #fffaf7;
  color: var(--color-ink);
  font-family: Georgia, "Times New Roman", serif;
  font-size: 0.78rem;
  font-weight: 700;
}

.wordmark-text {
  overflow: hidden;
  font-family: Georgia, "Times New Roman", serif;
  font-size: 1.15rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-overflow: ellipsis;
  text-transform: uppercase;
  white-space: nowrap;
}

.nav-book-pill {
  grid-column: 3;
  justify-self: end;
  min-height: 2.7rem;
  border: 1px solid var(--color-primary);
  background: var(--color-primary);
  color: #fff;
  padding: 0.65rem 1.25rem;
  font-size: 0.76rem;
  font-weight: 900;
  letter-spacing: 0.13em;
  text-decoration: none;
  text-transform: uppercase;
}

.nav-links {
  border-top: 1px solid rgba(234, 219, 210, 0.72);
}

.nav-links-inner {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 2.5rem;
  min-height: 3.25rem;
}

.nav-links-inner a {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 2.4rem;
  color: #4f3f38;
  font-size: 0.76rem;
  font-weight: 900;
  letter-spacing: 0.16em;
  text-decoration: none;
  text-transform: uppercase;
  white-space: nowrap;
  transition: color 0.15s ease;
}

.nav-links-inner a:hover {
  color: var(--color-primary);
}

.nav-links-inner .nav-cta {
  color: var(--color-primary);
}

.client-quick-actions {
  display: none;
}

@media (max-width: 760px) {
  .client-announcement {
    flex-direction: column;
    gap: 0.1rem;
    padding-top: 0.55rem;
    padding-bottom: 0.55rem;
    font-size: 0.66rem;
  }

  .nav-shell {
    grid-template-columns: 1fr;
    min-height: 4.15rem;
  }

  .client-wordmark {
    grid-column: 1;
  }

  .wordmark-text {
    max-width: 13rem;
    font-size: 0.95rem;
    letter-spacing: 0.06em;
  }

  .nav-book-pill {
    display: none;
  }

  .nav-links {
    display: none;
  }

  .client-quick-actions {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 0;
    padding-right: 0;
    padding-left: 0;
    border-top: 1px solid rgba(234, 219, 210, 0.72);
  }

  .client-quick-actions a {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 0;
    min-height: 3.6rem;
    border-right: 1px solid rgba(234, 219, 210, 0.9);
    background: #f8dcd5;
    color: var(--color-ink);
    font-size: 0.68rem;
    font-weight: 900;
    letter-spacing: 0.1em;
    text-decoration: none;
    text-transform: uppercase;
  }

  .client-quick-actions a:last-child {
    border-right: 0;
  }
}

@media (max-width: 420px) {
  .wordmark-mark {
    width: 2rem;
    height: 2rem;
  }

  .wordmark-text {
    max-width: 10rem;
    font-size: 0.86rem;
  }
}
</style>
