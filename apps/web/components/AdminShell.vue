<template>
  <div class="admin-shell">
    <aside class="admin-sidebar">
      <NuxtLink to="/" class="sidebar-brand">Luma Nail Studio</NuxtLink>
      <nav class="sidebar-nav">
        <NuxtLink
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          class="sidebar-link"
          active-class="sidebar-link--active"
        >
          {{ item.label }}
        </NuxtLink>
      </nav>
      <div class="sidebar-footer">
        <div class="sidebar-user">{{ session.user?.name }}</div>
        <div class="sidebar-role">{{ session.user?.role }}</div>
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
import type { AdminRole } from '@nailly/shared'

const session = useSessionStore()
const navItems = computed(() => adminNavItems((session.user?.role ?? 'staff') as AdminRole))

async function handleLogout() {
  await session.logout()
  navigateTo('/admin/login')
}
</script>

<style scoped>
.admin-shell {
  display: grid;
  grid-template-columns: 240px 1fr;
  min-height: 100vh;
}

.admin-sidebar {
  background: var(--color-ink);
  color: #fff;
  display: flex;
  flex-direction: column;
  padding: 1.5rem 0;
  position: sticky;
  top: 0;
  height: 100vh;
}

.sidebar-brand {
  color: #fff;
  font-size: 1.1rem;
  font-weight: 700;
  text-decoration: none;
  padding: 0 1.5rem 1.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  margin-bottom: 1rem;
}

.sidebar-nav {
  display: flex;
  flex-direction: column;
  flex: 1;
  gap: 0.25rem;
  padding: 0 0.75rem;
}

.sidebar-link {
  color: rgba(255, 255, 255, 0.65);
  text-decoration: none;
  padding: 0.5rem 0.75rem;
  border-radius: 6px;
  font-size: 0.9rem;
  font-weight: 500;
  transition: all 0.15s;
}

.sidebar-link:hover {
  color: #fff;
  background: rgba(255, 255, 255, 0.08);
}

.sidebar-link--active {
  color: #fff;
  background: var(--color-primary);
}

.sidebar-footer {
  padding: 1rem 1.5rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  font-size: 0.85rem;
}

.sidebar-user {
  font-weight: 600;
}

.sidebar-role {
  color: rgba(255, 255, 255, 0.5);
  text-transform: capitalize;
  font-size: 0.8rem;
  margin-bottom: 0.5rem;
}

.logout-btn {
  background: none;
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: rgba(255, 255, 255, 0.7);
  padding: 0.3rem 0.75rem;
  border-radius: 4px;
  font-size: 0.8rem;
  cursor: pointer;
}

.logout-btn:hover {
  background: rgba(255, 255, 255, 0.08);
  color: #fff;
}

.admin-main {
  padding: 2rem;
  background: var(--color-bg);
  min-height: 100vh;
}

@media (max-width: 768px) {
  .admin-shell {
    grid-template-columns: 1fr;
  }
  .admin-sidebar {
    height: auto;
    position: static;
    padding: 1rem;
  }
  .sidebar-nav {
    flex-direction: row;
    flex-wrap: wrap;
  }
}
</style>
