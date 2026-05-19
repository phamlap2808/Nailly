import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const landingPage = readFileSync(new URL('../pages/index.vue', import.meta.url), 'utf8')

describe('public homepage banner hero', () => {
  it('uses the first active public banner for hero copy, image, and CTAs', () => {
    expect(landingPage).toContain('site.value?.banners?.[0]')
    expect(landingPage).toContain('heroBanner')
    expect(landingPage).toContain('heroTitle')
    expect(landingPage).toContain('heroPrimaryHref')
    expect(landingPage).toContain('heroSecondaryHref')
  })
})
