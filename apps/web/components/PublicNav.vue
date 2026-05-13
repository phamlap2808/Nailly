<template>
  <header class="public-nav">
    <div class="container nav-inner">
      <NuxtLink to="/" class="logo">Luma Nail Studio</NuxtLink>
      <nav class="nav-links">
        <NuxtLink to="/booking">{{ $t('nav.book') }}</NuxtLink>
        <NuxtLink to="/admin/login">{{ $t('nav.admin') }}</NuxtLink>
      </nav>
    </div>
  </header>
</template>

<style scoped>
.public-nav {
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
  padding: 1rem 0;
  position: sticky;
  top: 0;
  z-index: 50;
}

.nav-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.logo {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--color-ink);
  text-decoration: none;
  letter-spacing: -0.01em;
}

.nav-links {
  display: flex;
  gap: 1.5rem;
}

.nav-links a {
  color: var(--color-muted);
  text-decoration: none;
  font-size: 0.9rem;
  font-weight: 500;
  transition: color 0.15s;
}

.nav-links a:hover {
  color: var(--color-primary);
}
</style>
