import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { defaultRolePermissions } from '@nailly/shared/src/permissions'
import { adminNavItems } from '../utils/admin-nav'

const bannersPage = readFileSync(new URL('../pages/admin/banners.vue', import.meta.url), 'utf8')
const mediaPage = readFileSync(new URL('../pages/admin/media.vue', import.meta.url), 'utf8')

describe('admin banner management', () => {
  it('adds banners to manager navigation only', () => {
    expect(adminNavItems(defaultRolePermissions.manager).map((item) => item.label)).toContain('Banners')
    expect(adminNavItems(defaultRolePermissions.staff).map((item) => item.label)).not.toContain('Banners')
  })

  it('renders a hero manager with compact cards, editor, media grid, and live preview', () => {
    expect(bannersPage).toContain('/admin/banners')
    expect(bannersPage).toContain('/admin/media')
    expect(bannersPage).toContain('hero-manager')
    expect(bannersPage).toContain('banner-card-list')
    expect(bannersPage).toContain('banner-card')
    expect(bannersPage).toContain('banner-editor')
    expect(bannersPage).toContain('hero-preview')
    expect(bannersPage).toContain('previewMode')
    expect(bannersPage).toContain('asset-grid')
    expect(bannersPage).toContain('primaryLabel')
    expect(bannersPage).toContain('secondaryHref')
  })

  it('supports uploading a banner image directly from banner management', () => {
    expect(bannersPage).toContain('Upload banner image')
    expect(bannersPage).toContain('handleBannerImageUpload')
    expect(bannersPage).toContain("formData.append('usageType', 'banner')")
    expect(bannersPage).toContain("`${baseUrl}/admin/media`")
    expect(bannersPage).toContain('form.imageId = uploaded.id')
  })

  it('lets uploaded media be marked for banner use', () => {
    expect(mediaPage).toContain('value="banner"')
    expect(mediaPage).toContain('Banner')
  })
})
