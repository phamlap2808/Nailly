<template>
  <div class="client-home">
    <PublicNav :shop-name="site?.shop?.name" />

    <main>
      <section class="campaign-hero">
        <img
          v-if="heroImage"
          :src="heroImage.url"
          :alt="heroImage.altText ?? 'Polished manicure detail'"
          class="hero-background"
          width="1680"
          height="980"
          fetchpriority="high"
        />
        <div v-else class="hero-background hero-background--fallback" aria-hidden="true">
          <span>LN</span>
        </div>
        <div class="hero-overlay" aria-hidden="true" />

        <div class="container campaign-copy">
          <p class="eyebrow">{{ heroEyebrow }}</p>
          <h1 class="display-title">{{ heroTitle }}</h1>
          <p>
            {{ heroSubtitle }}
          </p>
          <div class="campaign-actions">
            <NuxtLink :to="heroPrimaryHref" class="client-btn client-btn--light">{{ heroPrimaryLabel }}</NuxtLink>
            <NuxtLink v-if="heroSecondaryLabel && heroSecondaryHref" :to="heroSecondaryHref" class="client-btn client-btn--ghost">
              {{ heroSecondaryLabel }}
            </NuxtLink>
          </div>
        </div>
      </section>

      <section class="client-editorial intro-section">
        <div class="container intro-grid">
          <div class="intro-copy">
            <p class="eyebrow">Bring in the experts</p>
            <h2 class="display-title">Thoughtful nail care with a precise studio rhythm.</h2>
          </div>
          <div class="intro-body">
            <p>
              Choose a clean everyday finish, a longer-wear gel set, or detailed nail art with enough time for shape,
              prep, polish, and a calm close.
            </p>
            <NuxtLink to="/booking" class="client-btn client-btn--dark">Book now</NuxtLink>
          </div>
        </div>
      </section>

      <section class="client-tile-section">
        <div class="container client-tile-grid">
          <NuxtLink to="/#services" class="client-tile tile-services">
            <img
              v-if="tileImages.services"
              :src="tileImages.services.url"
              :alt="tileImages.services.altText ?? 'Nail services'"
              width="760"
              height="760"
              loading="lazy"
            />
            <span class="tile-label">Our services</span>
            <strong>Explore the treatment menu</strong>
          </NuxtLink>

          <NuxtLink to="/#gallery" class="client-tile tile-gallery">
            <img
              v-if="tileImages.gallery"
              :src="tileImages.gallery.url"
              :alt="tileImages.gallery.altText ?? 'Nail gallery'"
              width="760"
              height="760"
              loading="lazy"
            />
            <span class="tile-label">Lookbook</span>
            <strong>See recent sets</strong>
          </NuxtLink>

          <NuxtLink to="/booking" class="client-tile tile-booking">
            <img
              v-if="tileImages.booking"
              :src="tileImages.booking.url"
              :alt="tileImages.booking.altText ?? 'Book a nail appointment'"
              width="760"
              height="760"
              loading="lazy"
            />
            <span class="tile-label">Appointments</span>
            <strong>Find a time</strong>
          </NuxtLink>
        </div>
      </section>

      <section v-if="site?.services?.length" id="services" class="client-editorial services-section">
        <div class="container services-grid">
          <div class="section-intro">
            <p class="eyebrow">Services</p>
            <h2 class="display-title">Choose the pace and finish that fits your day.</h2>
            <p>
              Every appointment is paced for careful prep, a clean finish, and enough time to talk through shape,
              color, and detail.
            </p>
          </div>
          <div class="services-list">
            <ServiceCard v-for="svc in site.services" :key="svc.id" :service="svc" />
          </div>
        </div>
      </section>

      <section class="standards-band">
        <div class="container standards-grid">
          <article v-for="reason in whyReasons" :key="reason.title" class="standard-item">
            <span>{{ reason.kicker }}</span>
            <h3>{{ reason.title }}</h3>
            <p>{{ reason.text }}</p>
          </article>
        </div>
      </section>

      <section v-if="site?.gallery?.length" id="gallery" class="client-editorial gallery-section">
        <div class="container">
          <div class="section-intro">
            <p class="eyebrow">Gallery</p>
            <h2 class="display-title">Recent sets, soft color, and tiny details.</h2>
            <p>Browse studio favorites before choosing the shape, shade, or detail work for your next visit.</p>
          </div>
          <GalleryGrid :images="site.gallery" />
        </div>
      </section>

      <section v-if="site?.staff?.length || site?.shop" class="client-editorial visit-section">
        <div class="container visit-grid">
          <div v-if="site?.staff?.length" class="staff-panel">
            <p class="eyebrow">Artists</p>
            <h2 class="display-title">A small team with a careful hand.</h2>
            <div class="staff-list">
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
            <NuxtLink to="/booking" class="client-btn client-btn--dark">Book appointment</NuxtLink>
          </div>
        </div>
      </section>
    </main>

    <footer class="footer">
      <div class="container footer-content">
        <span>{{ site?.shop?.name ?? 'Luma Nail Studio' }}</span>
        <NuxtLink to="/booking">Book online</NuxtLink>
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
  banners: Array<{
    id: string
    eyebrow: string
    title: string
    subtitle: string
    primaryLabel: string
    primaryHref: string
    secondaryLabel: string | null
    secondaryHref: string | null
    imageUrl: string | null
    imageAltText: string | null
  }> | null
  staff: Array<{ id: string; name: string; title: string }> | null
}

const whyReasons = [
  {
    kicker: 'Clean tools',
    title: 'Sanitized stations for every appointment',
    text: 'Fresh implements, tidy surfaces, and a calm reset between guests.'
  },
  {
    kicker: 'Better wear',
    title: 'Products chosen for healthy-looking nails',
    text: 'Durable color systems paired with thoughtful prep for a refined finish.'
  },
  {
    kicker: 'Personal pace',
    title: 'Enough time for shape, care, and detail',
    text: 'Appointments are paced to avoid rushed decisions and uneven results.'
  }
]

const config = useRuntimeConfig()
const { data: site } = await useFetch<SitePayload>('/public/site', {
  key: 'public-site',
  baseURL: resolveRuntimeApiBaseUrl(config, import.meta.server)
})

const fallbackClientImages = {
  hero: {
    url: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?auto=format&fit=crop&w=1800&q=80',
    altText: 'Editorial manicure detail'
  },
  services: {
    url: 'https://images.unsplash.com/photo-1519014816548-bf5fe059798b?auto=format&fit=crop&w=1200&q=80',
    altText: 'Finished nail art'
  },
  gallery: {
    url: 'https://images.unsplash.com/photo-1599948128020-9a44505b0d1b?auto=format&fit=crop&w=1200&q=80',
    altText: 'Colorful nail polish palette'
  },
  booking: {
    url: 'https://images.unsplash.com/photo-1522337660859-02fbefca4702?auto=format&fit=crop&w=1200&q=80',
    altText: 'Manicure appointment in progress'
  }
}

function resolveClientImage(
  image: { url: string; altText: string | null } | null | undefined,
  fallback: { url: string; altText: string }
) {
  if (!image || image.url.includes('/nailly-media/demo/')) return fallback

  return image
}

const heroBanner = computed(() => site.value?.banners?.[0] ?? null)
const heroBannerImage = computed(() => {
  const banner = heroBanner.value
  if (!banner?.imageUrl) return site.value?.gallery?.[0]

  return {
    url: banner.imageUrl,
    altText: banner.imageAltText
  }
})
const heroImage = computed(() => resolveClientImage(heroBannerImage.value, fallbackClientImages.hero))
const heroEyebrow = computed(() => heroBanner.value?.eyebrow || site.value?.shop?.name || 'Luma Nail Studio')
const heroTitle = computed(() => heroBanner.value?.title || 'Polished care, made quiet and personal.')
const heroSubtitle = computed(
  () =>
    heroBanner.value?.subtitle ||
    site.value?.shop?.tagline ||
    'Detailed manicures, restorative pedicures, and small moments of calm, by appointment.'
)
const heroPrimaryLabel = computed(() => heroBanner.value?.primaryLabel || 'Book appointment')
const heroPrimaryHref = computed(() => heroBanner.value?.primaryHref || '/booking')
const heroSecondaryLabel = computed(() => heroBanner.value?.secondaryLabel || 'View services')
const heroSecondaryHref = computed(() => heroBanner.value?.secondaryHref || '/#services')
const tileImages = computed(() => {
  const gallery = site.value?.gallery ?? []

  return {
    services: resolveClientImage(gallery[1], fallbackClientImages.services),
    gallery: resolveClientImage(gallery[2], fallbackClientImages.gallery),
    booking: resolveClientImage(gallery[3], fallbackClientImages.booking)
  }
})

useSeoMeta({
  title: site.value?.shop?.name ?? 'Nail Studio',
  description: site.value?.shop?.seoDescription ?? ''
})
</script>

<style scoped>
.client-home {
  background: #fffaf7;
  color: var(--color-ink);
}

.campaign-hero {
  position: relative;
  display: grid;
  align-items: end;
  min-height: 42rem;
  overflow: hidden;
  background: #2b211d;
}

.hero-background {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.hero-background--fallback {
  display: grid;
  place-items: center;
  background: #c89686;
}

.hero-background--fallback span {
  display: grid;
  place-items: center;
  width: 8rem;
  height: 8rem;
  border: 1px solid rgba(255, 255, 255, 0.72);
  border-radius: 50%;
  color: #fff;
  font-family: Georgia, "Times New Roman", serif;
  font-size: 2rem;
  font-weight: 700;
}

.hero-overlay {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(90deg, rgba(20, 14, 11, 0.72), rgba(20, 14, 11, 0.34) 48%, rgba(20, 14, 11, 0.18)),
    linear-gradient(180deg, rgba(20, 14, 11, 0.08), rgba(20, 14, 11, 0.62));
}

.campaign-copy {
  position: relative;
  z-index: 1;
  padding-top: 8rem;
  padding-bottom: 6rem;
  color: #fff;
}

.campaign-copy .eyebrow {
  margin: 0 0 1rem;
  color: #f9d9d3;
}

.campaign-copy h1 {
  max-width: 48rem;
  margin: 0;
  font-size: 5.4rem;
  line-height: 0.98;
}

.campaign-copy p:not(.eyebrow) {
  max-width: 38rem;
  margin: 1.35rem 0 0;
  color: rgba(255, 255, 255, 0.88);
  font-size: 1.08rem;
  line-height: 1.7;
}

.campaign-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-top: 2rem;
}

.client-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 3rem;
  border: 1px solid currentColor;
  padding: 0.8rem 1.25rem;
  font-size: 0.76rem;
  font-weight: 900;
  letter-spacing: 0.14em;
  line-height: 1.2;
  text-decoration: none;
  text-transform: uppercase;
}

.client-btn--light {
  background: #fff;
  color: var(--color-ink);
}

.client-btn--ghost {
  background: rgba(255, 255, 255, 0.08);
  color: #fff;
}

.client-btn--dark {
  background: var(--color-ink);
  color: #fff;
}

.client-editorial {
  padding: 5rem 0;
}

.intro-section {
  background: #fffaf7;
}

.intro-grid,
.services-grid,
.visit-grid {
  display: grid;
  grid-template-columns: minmax(0, 0.9fr) minmax(0, 1.1fr);
  gap: 3rem;
  align-items: start;
}

.intro-copy h2,
.section-intro h2,
.staff-panel h2,
.visit-panel h2 {
  margin: 0;
  font-size: 3.3rem;
  line-height: 1;
}

.intro-copy .eyebrow,
.section-intro .eyebrow,
.staff-panel .eyebrow,
.visit-panel .eyebrow {
  margin: 0 0 0.95rem;
}

.intro-body {
  display: grid;
  gap: 1.35rem;
  justify-items: start;
}

.intro-body p,
.section-intro p:not(.eyebrow) {
  margin: 0;
  color: var(--color-muted);
  font-size: 1rem;
  line-height: 1.78;
}

.client-tile-section {
  padding: 0 0 5rem;
  background: #fffaf7;
}

.client-tile-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1rem;
}

.client-tile {
  position: relative;
  display: grid;
  align-content: end;
  min-height: 29rem;
  overflow: hidden;
  background: #eac6bf;
  color: #fff;
  padding: 1.4rem;
  text-decoration: none;
}

.client-tile::after {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(18, 12, 10, 0.06), rgba(18, 12, 10, 0.68));
  content: "";
}

.client-tile img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.25s ease;
}

.client-tile:hover img {
  transform: scale(1.035);
}

.tile-label,
.client-tile strong {
  position: relative;
  z-index: 1;
}

.tile-label {
  color: #f9d9d3;
  font-size: 0.72rem;
  font-weight: 900;
  letter-spacing: 0.15em;
  text-transform: uppercase;
}

.client-tile strong {
  display: block;
  max-width: 17rem;
  margin-top: 0.45rem;
  font-family: Georgia, "Times New Roman", serif;
  font-size: 2rem;
  line-height: 1.05;
}

.services-section,
.gallery-section {
  border-top: 1px solid #eadbd2;
  background: #fff;
}

.section-intro {
  display: grid;
  gap: 1rem;
  align-content: start;
}

.services-list {
  border-top: 1px solid #dfd0c3;
}

.standards-band {
  background: var(--color-ink);
  color: #fff;
  padding: 2.5rem 0;
}

.standards-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1.5rem;
}

.standard-item {
  border-left: 1px solid rgba(255, 255, 255, 0.26);
  padding-left: 1.2rem;
}

.standard-item span {
  color: #f9d9d3;
  font-size: 0.72rem;
  font-weight: 900;
  letter-spacing: 0.15em;
  text-transform: uppercase;
}

.standard-item h3 {
  margin: 0.7rem 0 0;
  font-family: Georgia, "Times New Roman", serif;
  font-size: 1.45rem;
  line-height: 1.15;
}

.standard-item p {
  margin: 0.8rem 0 0;
  color: rgba(255, 255, 255, 0.76);
  font-size: 0.95rem;
  line-height: 1.65;
}

.visit-section {
  border-top: 1px solid #eadbd2;
  background: #f8dcd5;
}

.staff-panel,
.visit-panel {
  display: grid;
  gap: 1.35rem;
  min-width: 0;
}

.staff-list {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  border-top: 1px solid rgba(43, 33, 29, 0.22);
}

.staff-card {
  border-bottom: 1px solid rgba(43, 33, 29, 0.22);
  padding: 1rem 1rem 1rem 0;
}

.staff-card h3 {
  margin: 0;
  font-size: 1rem;
}

.staff-card p,
.visit-panel address {
  margin: 0;
  color: var(--color-ink-soft);
  font-size: 0.95rem;
  line-height: 1.65;
}

.visit-panel address {
  display: grid;
  gap: 0.45rem;
  font-style: normal;
}

.visit-panel address a {
  color: var(--color-ink);
  font-weight: 900;
  text-decoration: none;
}

.visit-panel .client-btn {
  width: fit-content;
}

.footer {
  border-top: 1px solid #eadbd2;
  background: #fffaf7;
  padding: 1.3rem 0;
}

.footer-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  color: var(--color-muted);
  font-size: 0.9rem;
}

.footer-content a {
  color: var(--color-ink);
  font-weight: 900;
  letter-spacing: 0.1em;
  text-decoration: none;
  text-transform: uppercase;
}

@media (max-width: 920px) {
  .campaign-hero {
    min-height: 36rem;
  }

  .campaign-copy h1 {
    max-width: 38rem;
    font-size: 4rem;
  }

  .intro-grid,
  .services-grid,
  .visit-grid,
  .standards-grid {
    grid-template-columns: 1fr;
  }

  .client-tile-grid {
    grid-template-columns: 1fr;
  }

  .client-tile {
    min-height: 22rem;
  }
}

@media (max-width: 640px) {
  .campaign-hero {
    min-height: 34rem;
  }

  .campaign-copy {
    padding-top: 6rem;
    padding-bottom: 3.5rem;
  }

  .campaign-copy h1 {
    font-size: 3rem;
  }

  .campaign-copy p:not(.eyebrow) {
    font-size: 1rem;
  }

  .campaign-actions,
  .campaign-actions a,
  .intro-body .client-btn {
    width: 100%;
  }

  .client-editorial {
    padding: 3.75rem 0;
  }

  .intro-copy h2,
  .section-intro h2,
  .staff-panel h2,
  .visit-panel h2 {
    font-size: 2.45rem;
  }

  .client-tile-section {
    padding-bottom: 3.75rem;
  }

  .client-tile {
    min-height: 20rem;
  }

  .staff-list {
    grid-template-columns: 1fr;
  }

  .footer-content {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
