<template>
  <div>
    <PublicNav />

    <section class="hero">
      <div class="container hero-grid">
        <div class="hero-copy">
          <p class="eyebrow">{{ site?.shop?.name ?? 'Luma Nail Studio' }}</p>
          <h1 class="display-title">Warm, detailed nail care for everyday polish.</h1>
          <p class="hero-tagline">
            {{ site?.shop?.tagline ?? 'A calm studio for thoughtful manicures, restorative pedicures, and quiet moments of care.' }}
          </p>
          <div class="hero-actions">
            <NuxtLink to="/booking" class="btn-primary">{{ $t('nav.book') }}</NuxtLink>
            <NuxtLink to="/#services" class="btn-secondary">Explore services</NuxtLink>
          </div>
        </div>

        <div class="hero-visual" :class="{ 'hero-visual--fallback': !heroImage }">
          <NuxtImg
            v-if="heroImage"
            :src="heroImage.url"
            :alt="heroImage.altText ?? 'Salon manicure detail'"
            class="hero-img"
            width="720"
            height="920"
            sizes="sm:100vw md:44vw lg:520px"
            fetchpriority="high"
          />
          <div v-else class="hero-fallback" aria-hidden="true">
            <span>LN</span>
          </div>
          <div class="hero-note">
            <span>By appointment</span>
            <strong>{{ site?.shop?.phone ?? 'Book online' }}</strong>
          </div>
        </div>
      </div>
    </section>

    <section v-if="site?.services?.length" id="services" class="editorial-section services-section">
      <div class="container">
        <div class="section-intro">
          <p class="eyebrow">Services</p>
          <h2 class="display-title">Choose the pace and finish that fits your day.</h2>
          <p>
            From clean everyday color to artful details, each service is timed for unhurried prep, precise shaping, and a polished close.
          </p>
        </div>
        <div class="services-list">
          <ServiceCard v-for="svc in site.services" :key="svc.id" :service="svc" />
        </div>
      </div>
    </section>

    <section class="proof-band">
      <div class="container proof-content">
        <div class="proof-intro">
          <p class="eyebrow">Why clients return</p>
          <h2 class="display-title">Care standards you can feel.</h2>
        </div>
        <div class="proof-grid">
          <article v-for="reason in whyReasons" :key="reason.title" class="proof-card">
            <p>{{ reason.kicker }}</p>
            <h3>{{ reason.title }}</h3>
            <span>{{ reason.text }}</span>
          </article>
        </div>
      </div>
    </section>

    <section v-if="site?.gallery?.length" id="gallery" class="editorial-section">
      <div class="container">
        <div class="section-intro">
          <p class="eyebrow">Gallery</p>
          <h2 class="display-title">Recent sets, soft color, and tiny details.</h2>
          <p>Browse a few studio favorites before choosing the shape, shade, or detail work for your next visit.</p>
        </div>
        <GalleryGrid :images="site.gallery" />
      </div>
    </section>

    <section v-if="site?.staff?.length || site?.shop" class="editorial-section visit-section">
      <div class="container visit-grid">
        <div v-if="site?.staff?.length" class="staff-panel">
          <div class="section-intro">
            <p class="eyebrow">Artists</p>
            <h2 class="display-title">A small team with a careful hand.</h2>
          </div>
          <div class="staff-grid">
            <article v-for="person in site.staff" :key="person.id" class="staff-card">
              <h3>{{ person.name }}</h3>
              <p>{{ person.title }}</p>
            </article>
          </div>
        </div>

        <div v-if="site?.shop" class="visit-panel">
          <p class="eyebrow">Visit</p>
          <h2 class="display-title">Settle in at the studio.</h2>
          <address>
            <span>{{ site.shop.address }}</span>
            <a :href="`tel:${site.shop.phone}`">{{ site.shop.phone }}</a>
          </address>
          <NuxtLink to="/booking" class="btn-primary">{{ $t('nav.book') }}</NuxtLink>
        </div>
      </div>
    </section>

    <footer class="footer">
      <div class="container footer-content">
        <span>{{ site?.shop?.name ?? 'Luma Nail Studio' }}</span>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { resolveRuntimeApiBaseUrl } from '../utils/api-url'

interface SitePayload {
  shop: { name: string; tagline: string; address: string; phone: string; seoDescription: string } | null
  services: Array<{ id: string; name: string; description: string; durationMinutes: number; priceCents: number }> | null
  gallery: Array<{ url: string; altText: string | null }> | null
  staff: Array<{ id: string; name: string; title: string }> | null
}

const whyReasons = [
  {
    kicker: 'Clean tools',
    title: 'Sanitized stations for every appointment',
    text: 'Fresh implements, tidy surfaces, and a calm reset between guests keep the experience comfortable.'
  },
  {
    kicker: 'Better wear',
    title: 'Products chosen for healthy-looking nails',
    text: 'We pair durable color systems with thoughtful prep so manicures feel refined long after you leave.'
  },
  {
    kicker: 'Personal pace',
    title: 'Enough time for shape, care, and detail',
    text: 'Appointments are paced to avoid rushed decisions, whether you want a simple gloss or delicate art.'
  }
]

const config = useRuntimeConfig()
const { data: site } = await useFetch<SitePayload>('/public/site', {
  baseURL: resolveRuntimeApiBaseUrl(config, import.meta.server)
})

const heroImage = computed(() => site.value?.gallery?.[0] ?? null)

useSeoMeta({
  title: site.value?.shop?.name ?? 'Nail Studio',
  description: site.value?.shop?.seoDescription ?? ''
})
</script>

<style scoped>
.hero {
  overflow: hidden;
  background:
    radial-gradient(ellipse at 72% 12%, rgba(184, 118, 92, 0.18), transparent 42%),
    linear-gradient(180deg, var(--color-bg-strong) 0%, var(--color-bg) 100%);
  padding: 4.8rem 0 5.4rem;
}

.hero-grid {
  display: grid;
  grid-template-columns: minmax(0, 0.92fr) minmax(18rem, 0.78fr);
  align-items: center;
  gap: clamp(2rem, 5vw, 5.5rem);
}

.hero-copy {
  min-width: 0;
}

.hero-copy .eyebrow,
.section-intro .eyebrow,
.visit-panel .eyebrow {
  margin: 0 0 0.85rem;
}

.hero-copy h1 {
  max-width: 45rem;
  margin: 0;
  color: var(--color-ink);
  font-size: clamp(3.4rem, 7.4vw, 7rem);
}

.hero-tagline {
  max-width: 38rem;
  margin: 1.35rem 0 0;
  color: var(--color-ink-soft);
  font-size: 1.08rem;
  line-height: 1.75;
}

.hero-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-top: 2rem;
}

.hero-visual {
  position: relative;
  overflow: hidden;
  min-height: clamp(28rem, 52vw, 39rem);
  border: 1px solid rgba(223, 208, 195, 0.78);
  border-radius: var(--radius-media);
  background: linear-gradient(140deg, #eadbd0 0%, #c8957f 100%);
  box-shadow: var(--shadow-soft);
}

.hero-visual::after {
  position: absolute;
  inset: 0;
  background: linear-gradient(rgba(43, 33, 29, 0.08), rgba(43, 33, 29, 0.18));
  content: "";
  pointer-events: none;
}

.hero-img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.hero-fallback {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  background:
    linear-gradient(135deg, rgba(255, 250, 244, 0.64), rgba(125, 78, 63, 0.2)),
    linear-gradient(140deg, #eadbd0 0%, #c8957f 100%);
}

.hero-fallback span {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 8rem;
  height: 8rem;
  border: 1px solid rgba(255, 250, 244, 0.72);
  border-radius: 50%;
  color: rgba(43, 33, 29, 0.68);
  font-family: Georgia, "Times New Roman", serif;
  font-size: 2rem;
  font-weight: 700;
}

.hero-note {
  position: absolute;
  right: 1rem;
  bottom: 1rem;
  z-index: 1;
  display: grid;
  gap: 0.15rem;
  max-width: min(18rem, calc(100% - 2rem));
  border: 1px solid rgba(255, 250, 244, 0.78);
  border-radius: var(--radius-card);
  background: rgba(255, 250, 244, 0.88);
  padding: 0.85rem 1rem;
  color: var(--color-ink);
  box-shadow: var(--shadow-soft);
}

.hero-note span {
  color: var(--color-muted);
  font-size: 0.76rem;
  font-weight: 800;
  text-transform: uppercase;
}

.hero-note strong {
  font-size: 0.98rem;
}

.editorial-section {
  padding: clamp(4.5rem, 8vw, 7rem) 0;
}

.services-section {
  background: var(--color-bg);
}

.section-intro {
  max-width: 44rem;
  margin-bottom: 2.2rem;
}

.section-intro h2,
.visit-panel h2 {
  margin: 0;
  color: var(--color-ink);
  font-size: clamp(2.1rem, 4.4vw, 4.1rem);
}

.section-intro p:not(.eyebrow) {
  margin: 1rem 0 0;
  color: var(--color-muted);
  font-size: 1rem;
  line-height: 1.7;
}

.services-list {
  border-top: 0;
}

.proof-band {
  background: var(--color-primary);
  color: #fff;
  padding: 2.8rem 0;
}

.proof-content {
  display: grid;
  grid-template-columns: minmax(14rem, 0.58fr) minmax(0, 1fr);
  gap: clamp(1.5rem, 4vw, 3rem);
  align-items: start;
}

.proof-intro .eyebrow {
  margin: 0 0 0.75rem;
  color: rgba(255, 255, 255, 0.74);
}

.proof-intro h2 {
  margin: 0;
  color: #fff;
  font-size: clamp(1.9rem, 3.6vw, 3.3rem);
}

.proof-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1rem;
}

.proof-card {
  min-width: 0;
  border-left: 1px solid rgba(255, 255, 255, 0.28);
  padding: 0.2rem 0 0.2rem 1.2rem;
}

.proof-card p {
  margin: 0 0 0.55rem;
  color: rgba(255, 255, 255, 0.74);
  font-size: 0.72rem;
  font-weight: 800;
  text-transform: uppercase;
}

.proof-card h3 {
  margin: 0;
  color: #fff;
  font-family: Georgia, "Times New Roman", serif;
  font-size: 1.35rem;
  line-height: 1.18;
}

.proof-card span {
  display: block;
  margin-top: 0.75rem;
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.92rem;
  line-height: 1.58;
}

.visit-section {
  background: var(--color-bg-strong);
}

.visit-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.15fr) minmax(18rem, 0.85fr);
  gap: 1.5rem;
  align-items: start;
}

.staff-panel,
.visit-panel {
  min-width: 0;
  border: 1px solid rgba(223, 208, 195, 0.78);
  border-radius: var(--radius-card);
  background: rgba(255, 250, 244, 0.72);
  padding: clamp(1.3rem, 3vw, 2rem);
  box-shadow: var(--shadow-soft);
}

.staff-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.8rem;
}

.staff-card {
  border-top: 1px solid var(--color-border);
  padding-top: 1rem;
}

.staff-card h3 {
  margin: 0;
  color: var(--color-ink);
  font-size: 1rem;
}

.staff-card p {
  margin: 0.3rem 0 0;
  color: var(--color-muted);
  font-size: 0.9rem;
}

.visit-panel {
  display: grid;
  gap: 1.1rem;
}

.visit-panel h2 {
  font-size: clamp(2rem, 4vw, 3.4rem);
}

.visit-panel address {
  display: grid;
  gap: 0.45rem;
  color: var(--color-muted);
  font-style: normal;
  line-height: 1.6;
}

.visit-panel address a {
  color: var(--color-primary);
  font-weight: 800;
  text-decoration: none;
}

.visit-panel .btn-primary {
  width: fit-content;
}

.footer {
  border-top: 1px solid rgba(223, 208, 195, 0.78);
  background: var(--color-surface);
  padding: 1.2rem 0;
}

.footer-content {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  color: var(--color-muted);
  font-size: 0.9rem;
}

.footer-content a {
  color: var(--color-ink-soft);
  font-weight: 700;
  text-decoration: none;
}

@media (max-width: 900px) {
  .hero {
    padding-top: 3.6rem;
  }

  .hero-grid,
  .visit-grid {
    grid-template-columns: 1fr;
  }

  .hero-visual {
    min-height: 26rem;
  }

  .proof-content,
  .proof-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .hero {
    padding: 3rem 0 4rem;
  }

  .hero-copy h1 {
    font-size: clamp(2.7rem, 16vw, 4.1rem);
  }

  .hero-actions,
  .hero-actions a {
    width: 100%;
  }

  .hero-visual {
    min-height: 22rem;
  }

  .editorial-section {
    padding: 3.6rem 0;
  }

  .staff-grid {
    grid-template-columns: 1fr;
  }
}
</style>
