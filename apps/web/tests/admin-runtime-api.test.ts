import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const serverRenderedAdminPages = [
  '../pages/admin/index.vue',
  '../pages/admin/bookings.vue',
  '../pages/admin/invoices/index.vue',
  '../pages/admin/invoices/[id]/index.vue',
  '../pages/admin/media.vue',
  '../pages/admin/promotions.vue',
  '../pages/admin/reports.vue',
  '../pages/admin/services.vue',
  '../pages/admin/settings.vue',
  '../pages/admin/staff.vue'
]

describe('server-rendered admin pages', () => {
  it('resolve the internal API URL during SSR', () => {
    for (const path of serverRenderedAdminPages) {
      const source = readFileSync(new URL(path, import.meta.url), 'utf8')

      expect(source, path).toContain('resolveRuntimeApiBaseUrl(config, import.meta.server)')
      expect(source, path).not.toContain('const baseUrl = config.public.apiBaseUrl')
    }
  })
})
