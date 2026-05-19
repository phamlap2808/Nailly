import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const reportsPage = readFileSync(new URL('../pages/admin/reports.vue', import.meta.url), 'utf8')
const packageJson = readFileSync(new URL('../package.json', import.meta.url), 'utf8')

describe('admin reports tabs', () => {
  it('uses Nuxt UI tabs with URL-backed active report state', () => {
    expect(reportsPage).toContain('<UTabs')
    expect(reportsPage).toContain('v-model="activeReportTab"')
    expect(reportsPage).toContain('route.query.tab')
    expect(reportsPage).toContain('router.push')
  })

  it('defines the approved report tab values', () => {
    for (const value of ['overview', 'revenue', 'payments', 'services', 'staff', 'exports']) {
      expect(reportsPage).toContain(`value: '${value}'`)
    }
  })

  it('renders the expected report tab panels and chart labels', () => {
    for (const label of [
      'Revenue trend',
      'Payment mix',
      'Revenue by status',
      'Payments by method',
      'Service sales',
      'Staff payroll',
      'CSV downloads'
    ]) {
      expect(reportsPage).toContain(label)
    }
  })

  it('keeps SSR data requests internal while export links use the public API URL', () => {
    expect(reportsPage).toContain('resolveRuntimeApiBaseUrl(config, import.meta.server)')
    expect(reportsPage).toContain('const publicApiBaseUrl = config.public.apiBaseUrl ??')
    expect(reportsPage).toContain('buildApiUrl(requestBaseUrl')
    expect(reportsPage).toContain('buildApiUrl(publicApiBaseUrl')
    expect(reportsPage).not.toContain('`${baseUrl}/admin/exports/${fileName}`')
  })

  it('styles report tabs as quiet editorial segmented controls', () => {
    expect(reportsPage).toContain("overflow-x: auto;")
    expect(reportsPage).toContain("flex-wrap: nowrap;")
    expect(reportsPage).toContain("border: 0;")
    expect(reportsPage).toContain("appearance: none;")
    expect(reportsPage).toContain("[data-slot='trigger'][data-state='active']")
    expect(reportsPage).toContain("background: var(--color-primary);")
    expect(reportsPage).toContain("outline: none;")
  })

  it('renders a full print packet and unlocks the admin shell for printing', () => {
    expect(reportsPage).toContain('class="print-report"')
    expect(reportsPage).toContain('Printable finance report')
    expect(reportsPage).toContain('printRangeLabel')
    expect(reportsPage).toContain('printedAtLabel')
    expect(reportsPage).toContain('class="print-section"')
    expect(reportsPage).toContain(':global(.admin-sidebar)')
    expect(reportsPage).toContain(':global(.admin-main)')
    expect(reportsPage).toContain('height: auto !important;')
    expect(reportsPage).toContain('overflow: visible !important;')
    expect(reportsPage).toContain('.report-tab-panel')
    expect(reportsPage).toContain('display: none !important;')
    expect(reportsPage).toContain('break-inside: avoid;')
  })

  it('uses Chart.js canvas charts for revenue trend and payment mix', () => {
    expect(packageJson).toContain('"chart.js"')
    expect(reportsPage).toContain("from 'chart.js/auto'")
    expect(reportsPage).toContain('ref="revenueTrendCanvas"')
    expect(reportsPage).toContain('ref="paymentMixCanvas"')
    expect(reportsPage).toContain('new Chart(revenueTrendCanvas.value')
    expect(reportsPage).toContain('new Chart(paymentMixCanvas.value')
    expect(reportsPage).toContain('destroyReportCharts')
  })
})
