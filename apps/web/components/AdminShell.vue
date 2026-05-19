<template>
  <div class="admin-shell">
    <aside class="admin-sidebar">
      <NuxtLink to="/admin" class="sidebar-brand" :aria-label="`${sidebarShopName} admin home`">
        <span class="brand-mark">{{ sidebarBrandInitials }}</span>
        <span class="sidebar-brand-name">{{ sidebarShopName }}</span>
      </NuxtLink>
      <nav class="sidebar-nav" aria-label="Admin navigation">
        <NuxtLink
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          class="sidebar-link"
          exact-active-class="sidebar-link--active"
        >
          <span class="link-dot" />
          {{ item.label }}
        </NuxtLink>
      </nav>
      <div class="sidebar-footer">
        <div>
          <div class="sidebar-user">{{ session.user?.name }}</div>
          <div class="sidebar-role">{{ session.user?.role }}</div>
        </div>
        <button class="logout-btn" @click="handleLogout">Log out</button>
      </div>
    </aside>
    <main class="admin-main">
      <slot />
    </main>
  </div>
</template>

<script setup lang="ts">
import { adminNavItems } from '../utils/admin-nav'
import { resolveRuntimeApiBaseUrl } from '../utils/api-url'
import { resolveShopName, shopInitials } from '../utils/shop-brand'

interface SidebarShopSettings {
  name?: string | null
}

const session = useSessionStore()
const config = useRuntimeConfig()
const baseUrl = resolveRuntimeApiBaseUrl(config, import.meta.server)
const requestHeaders = import.meta.server ? useRequestHeaders(['cookie']) : undefined
const sidebarShopNameState = useState<string | null>('admin-sidebar-shop-name', () => null)
const navItems = computed(() => adminNavItems(session.user?.permissions))
const { data: sidebarSettings } = await useFetch<SidebarShopSettings | null>('/admin/shop-settings', {
  key: 'admin-sidebar-shop-settings',
  baseURL: baseUrl,
  credentials: 'include',
  headers: requestHeaders,
  default: () => null
})

watchEffect(() => {
  const name = sidebarSettings.value?.name?.trim()
  if (name) sidebarShopNameState.value = name
})

const sidebarShopName = computed(() => resolveShopName(sidebarShopNameState.value ?? sidebarSettings.value?.name))
const sidebarBrandInitials = computed(() => shopInitials(sidebarShopName.value))

onMounted(() => {
  document.documentElement.classList.add('admin-root-lock')
  document.body.classList.add('admin-root-lock')
  document.scrollingElement?.scrollTo({ top: 0, left: 0 })
})

onBeforeUnmount(() => {
  document.documentElement.classList.remove('admin-root-lock')
  document.body.classList.remove('admin-root-lock')
})

async function handleLogout() {
  await session.logout()
  navigateTo('/admin/login')
}
</script>

<style scoped>
:global(html.admin-root-lock),
:global(body.admin-root-lock) {
  height: 100%;
  overflow: hidden;
}

:global(body.admin-root-lock #__nuxt) {
  height: 100%;
  overflow: hidden;
}

.admin-shell {
  display: grid;
  grid-template-columns: 250px minmax(0, 1fr);
  grid-template-rows: minmax(0, 1fr);
  height: 100vh;
  height: 100dvh;
  overflow: hidden;
  background: var(--color-bg);
}

.admin-sidebar {
  position: sticky;
  top: 0;
  min-height: 0;
  height: 100%;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  background: var(--color-ink);
  color: var(--color-surface);
  padding: 1rem;
}

.sidebar-brand {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  color: #fff8ef;
  text-decoration: none;
  font-family: Georgia, "Times New Roman", serif;
  font-size: 1.15rem;
  line-height: 1.1;
  letter-spacing: 0;
  padding: 0.35rem 0.35rem 1rem;
  border-bottom: 1px solid rgba(255, 250, 244, 0.1);
}

.brand-mark {
  width: 2rem;
  height: 2rem;
  border-radius: 999px;
  display: inline-grid;
  place-items: center;
  background: #fff8ef;
  color: var(--color-ink);
  font-size: 0.75rem;
}

.sidebar-nav {
  display: grid;
  grid-auto-rows: max-content;
  align-content: start;
  gap: 0.35rem;
  padding: 1rem 0;
  flex: 1;
}

.sidebar-link {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  border-radius: var(--radius-card);
  color: rgba(255, 248, 239, 0.68);
  text-decoration: none;
  min-height: 2.6rem;
  padding: 0.55rem 0.75rem;
  font-size: 0.9rem;
  font-weight: 700;
}

.sidebar-link:hover,
.sidebar-link--active {
  color: #fff;
  background: var(--color-primary);
}

.link-dot {
  width: 0.4rem;
  height: 0.4rem;
  border-radius: 999px;
  background: currentColor;
}

.sidebar-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  border-top: 1px solid rgba(255, 250, 244, 0.1);
  padding-top: 1rem;
}

.sidebar-user {
  font-weight: 800;
}

.sidebar-role {
  color: rgba(255, 248, 239, 0.55);
  text-transform: capitalize;
  font-size: 0.78rem;
}

.logout-btn {
  border: 1px solid rgba(255, 248, 239, 0.22);
  border-radius: var(--radius-card);
  background: transparent;
  color: rgba(255, 248, 239, 0.78);
  padding: 0.45rem 0.65rem;
  cursor: pointer;
}

.logout-btn:hover {
  color: #fff;
  background: rgba(255, 248, 239, 0.08);
}

.admin-main {
  min-width: 0;
  min-height: 0;
  overflow-y: auto;
  padding: 2rem;
}

@media (max-width: 820px) {
  .admin-shell {
    grid-template-columns: 1fr;
    grid-template-rows: auto minmax(0, 1fr);
  }

  .admin-sidebar {
    position: static;
    height: auto;
  }

  .sidebar-nav {
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  }

  .admin-main {
    padding: 1rem;
  }
}
</style>
