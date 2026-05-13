<template>
  <div>
    <PublicNav />

    <!-- Hero -->
    <section class="hero">
      <div class="container hero-content">
        <h1>{{ site?.shop?.name ?? 'Nail Studio' }}</h1>
        <p class="hero-tagline">{{ site?.shop?.tagline }}</p>
      </div>
    </section>

    <!-- Services -->
    <section v-if="site?.services?.length" class="container section">
      <h2 class="section-heading">Services</h2>
      <div class="services-grid">
        <ServiceCard v-for="svc in site.services" :key="svc.id" :service="svc" />
      </div>
    </section>

    <!-- Why Choose Us -->
    <section class="container section">
      <h2 class="section-heading">Why Choose Us</h2>
      <div class="why-grid">
        <div v-for="reason in whyReasons" :key="reason.title" class="why-card">
          <h3>{{ reason.title }}</h3>
          <p>{{ reason.text }}</p>
        </div>
      </div>
    </section>

    <!-- Gallery -->
    <section v-if="site?.gallery?.length" class="container section">
      <h2 class="section-heading">Gallery</h2>
      <GalleryGrid :images="site.gallery" />
    </section>

    <!-- Staff -->
    <section v-if="site?.staff?.length" class="container section">
      <h2 class="section-heading">Our Team</h2>
      <div class="staff-grid">
        <div v-for="person in site.staff" :key="person.id" class="staff-card">
          <div class="staff-name">{{ person.name }}</div>
          <div class="staff-title">{{ person.title }}</div>
        </div>
      </div>
    </section>

    <!-- Location & Hours -->
    <section v-if="site?.shop" class="container section">
      <h2 class="section-heading">Location & Hours</h2>
      <div class="location-box">
        <p>{{ site.shop.address }}</p>
        <p>{{ site.shop.phone }}</p>
      </div>
    </section>

    <!-- CTA -->
    <section class="cta">
      <div class="container cta-content">
        <h2>Ready to book?</h2>
        <NuxtLink to="/booking" class="cta-button">{{ $t('nav.book') }}</NuxtLink>
      </div>
    </section>

    <footer class="footer">
      <div class="container footer-content">
        <span>{{ site?.shop?.name ?? 'Nail Studio' }}</span>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
const whyReasons = [
  { title: 'Expert Technicians', text: 'Our nail artists bring years of specialized training and experience to every appointment.' },
  { title: 'Premium Products', text: 'We use top-quality polishes, gels, and treatments for lasting results and healthy nails.' },
  { title: 'Hygienic Standards', text: 'All tools are sterilized and stations sanitized between each client.' }
]

const { data: site } = await useFetch('/public/site', {
  baseURL: useRuntimeConfig().public.apiBaseUrl
})

useSeoMeta({
  title: site.value?.shop?.name ?? 'Nail Studio',
  description: site.value?.shop?.seoDescription ?? ''
})
</script>

<style scoped>
.hero {
  background: linear-gradient(135deg, #f0ebe3 0%, #e8ded1 100%);
  padding: 5rem 0 4rem;
  text-align: center;
}

.hero-content h1 {
  font-size: 2.5rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  margin: 0 0 0.5rem;
  color: var(--color-ink);
}

.hero-tagline {
  font-size: 1.1rem;
  color: var(--color-muted);
  margin: 0;
}

.section {
  padding: 4rem 0;
}

.section-heading {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--color-ink);
  margin: 0 0 1.5rem;
}

.services-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.25rem;
}

.why-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.25rem;
}

.why-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-card);
  padding: 1.5rem;
}

.why-card h3 {
  font-size: 1.05rem;
  font-weight: 600;
  margin: 0 0 0.5rem;
}

.why-card p {
  color: var(--color-muted);
  font-size: 0.9rem;
  line-height: 1.5;
  margin: 0;
}

.staff-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 1.25rem;
}

.staff-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-card);
  padding: 1.5rem;
}

.staff-name {
  font-weight: 600;
  font-size: 1rem;
  margin-bottom: 0.25rem;
}

.staff-title {
  color: var(--color-muted);
  font-size: 0.85rem;
}

.location-box {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-card);
  padding: 1.5rem;
  font-size: 0.95rem;
  color: var(--color-muted);
  line-height: 1.6;
}

.location-box p {
  margin: 0;
}

.cta {
  background: var(--color-primary);
  padding: 3.5rem 0;
  text-align: center;
}

.cta-content h2 {
  color: #fff;
  font-size: 1.75rem;
  font-weight: 600;
  margin: 0 0 1.25rem;
}

.cta-button {
  display: inline-block;
  background: #fff;
  color: var(--color-primary);
  padding: 0.75rem 2rem;
  border-radius: var(--radius-card);
  font-weight: 600;
  text-decoration: none;
  transition: background 0.15s;
}

.cta-button:hover {
  background: #f0f4ff;
}

.footer {
  background: var(--color-surface);
  border-top: 1px solid var(--color-border);
  padding: 1.5rem 0;
}

.footer-content {
  font-size: 0.85rem;
  color: var(--color-muted);
}
</style>
