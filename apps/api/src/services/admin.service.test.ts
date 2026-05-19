import { describe, expect, it, vi } from 'vitest'
import { createAdminService } from './admin.service'

describe('createAdminService banner management', () => {
  it('invalidates the public site cache when banners change', async () => {
    const repository = {
      listBanners: vi.fn().mockResolvedValue([]),
      createBanner: vi.fn().mockResolvedValue({ id: 'banner-1' }),
      updateBanner: vi.fn().mockResolvedValue({ id: 'banner-1' })
    } as any
    const cache = { del: vi.fn().mockResolvedValue(undefined) }
    const service = createAdminService(repository, cache)

    await service.createBanner({
      title: 'Fresh color for the new season',
      subtitle: 'Book a calm appointment for detailed nail care.',
      eyebrow: 'Spring edit',
      imageId: null,
      primaryLabel: 'Book now',
      primaryHref: '/booking',
      secondaryLabel: 'View services',
      secondaryHref: '/#services',
      sortOrder: 1,
      active: true
    })
    await service.updateBanner('banner-1', { title: 'Updated banner' })

    expect(repository.createBanner).toHaveBeenCalledTimes(1)
    expect(repository.updateBanner).toHaveBeenCalledWith('banner-1', { title: 'Updated banner' })
    expect(cache.del).toHaveBeenCalledTimes(2)
    expect(cache.del).toHaveBeenCalledWith('public:site')
  })
})
