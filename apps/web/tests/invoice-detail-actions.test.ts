import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const invoiceDetailPage = readFileSync(
  new URL('../pages/admin/invoices/[id]/index.vue', import.meta.url),
  'utf8'
)
const nuxtConfig = readFileSync(new URL('../nuxt.config.ts', import.meta.url), 'utf8')
const webPackage = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8')) as {
  devDependencies?: Record<string, string>
}

describe('invoice detail header actions', () => {
  it('exposes a back link and a consolidated print menu', () => {
    expect(invoiceDetailPage).toContain('to="/admin/invoices"')
    expect(invoiceDetailPage).toContain('Back to invoices')
    expect(invoiceDetailPage).toContain('aria-label="Print"')
    expect(invoiceDetailPage).toContain('name="lucide:printer"')
    expect(invoiceDetailPage).toContain('role="menu"')
    expect(invoiceDetailPage).toContain('Print receipt')
    expect(invoiceDetailPage).toContain('Print A4')
  })

  it('prebundles the printer icon used by the detail header', () => {
    expect(nuxtConfig).toContain('clientBundle')
    expect(nuxtConfig).toContain("'lucide:printer'")
  })

  it('installs the lucide icon collection locally for deterministic builds', () => {
    expect(webPackage.devDependencies?.['@iconify-json/lucide']).toBeDefined()
  })
})
