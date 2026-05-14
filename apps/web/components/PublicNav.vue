<template>
  <header class="public-nav">
    <div class="container nav-inner">
      <NuxtLink to="/" class="logo" aria-label="Luma Nail Studio home">
        <span class="logo-mark">LN</span>
        <span>Luma Nail Studio</span>
      </NuxtLink>
      <nav class="nav-links" aria-label="Public navigation">
        <NuxtLink to="/#services">Services</NuxtLink>
        <NuxtLink to="/#gallery">Gallery</NuxtLink>
        <NuxtLink to="/booking" class="nav-cta">{{ $t('nav.book') }}</NuxtLink>
        <NuxtLink to="/admin/login" class="admin-link">{{ $t('nav.admin') }}</NuxtLink>
      </nav>
    </div>
  </header>
</template>

<style scoped>
.public-nav {
  position: sticky;
  top: 0;
  z-index: 50;
  border-bottom: 1px solid rgba(223, 208, 195, 0.76);
  background: rgba(255, 250, 244, 0.88);
  backdrop-filter: blur(16px);
}

.nav-inner {
  display: grid;
  grid-template-columns: minmax(0, auto) minmax(0, 1fr);
  align-items: center;
  gap: 1rem;
  min-height: 4.4rem;
}

.logo {
  display: inline-flex;
  align-items: center;
  gap: 0.65rem;
  min-width: 0;
  color: var(--color-ink);
  font-weight: 800;
  text-decoration: none;
}

.logo-mark {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.35rem;
  height: 2.35rem;
  flex: 0 0 auto;
  border: 1px solid rgba(125, 78, 63, 0.24);
  border-radius: 50%;
  background: var(--color-primary);
  color: #fff;
  font-family: Georgia, "Times New Roman", serif;
  font-size: 0.82rem;
  font-weight: 700;
}

.nav-links {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.4rem;
  min-width: 0;
}

.nav-links a {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 2.45rem;
  border-radius: var(--radius-card);
  padding: 0.45rem 0.7rem;
  color: var(--color-ink-soft);
  font-size: 0.9rem;
  font-weight: 700;
  text-decoration: none;
  white-space: nowrap;
  transition: background 0.15s ease, color 0.15s ease;
}

.nav-links a:hover {
  background: rgba(125, 78, 63, 0.08);
  color: var(--color-primary);
}

.nav-links .nav-cta {
  border: 1px solid var(--color-primary);
  background: var(--color-primary);
  color: #fff;
}

.nav-links .nav-cta:hover {
  background: var(--color-primary-hover);
  color: #fff;
}

.admin-link {
  color: var(--color-muted);
}

@media (max-width: 760px) {
  .nav-inner {
    grid-template-columns: 1fr;
    gap: 0.75rem;
    padding-top: 0.75rem;
    padding-bottom: 0.75rem;
  }

  .nav-links {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    width: 100%;
  }

  .nav-links a {
    min-width: 0;
    padding-right: 0.45rem;
    padding-left: 0.45rem;
    font-size: 0.82rem;
  }
}

@media (max-width: 460px) {
  .logo {
    font-size: 0.95rem;
  }

  .nav-links {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
