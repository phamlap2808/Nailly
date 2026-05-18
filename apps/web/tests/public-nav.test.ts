import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { publicNavItems } from '../utils/public-nav'

const enMessages = JSON.parse(readFileSync(new URL('../i18n/locales/en.json', import.meta.url), 'utf8')) as {
  nav: Record<string, string>
}

describe('publicNavItems', () => {
  it('does not expose admin navigation on public pages', () => {
    expect(publicNavItems.map((item) => item.to)).toEqual(['/#services', '/#gallery', '/booking'])
    expect(publicNavItems.some((item) => item.to.startsWith('/admin'))).toBe(false)
  })

  it('has English labels for every translated public navigation item', () => {
    expect(
      publicNavItems.map((item) => {
        const key = item.labelKey.replace('nav.', '')
        return enMessages.nav[key]
      })
    ).toEqual(['Services', 'Gallery', 'Book appointment'])
  })
})
