import { describe, expect, it, vi } from 'vitest'
import { PublicSiteService } from './public-site.service'

describe('PublicSiteService', () => {
  it('returns cached public site payload when available', async () => {
    const cache = {
      getJson: vi.fn().mockResolvedValue({ shop: { name: 'Cached Studio' } }),
      setJson: vi.fn()
    }
    const repository = { getPublicSite: vi.fn() }

    const service = new PublicSiteService(repository, cache)
    const result = await service.getPublicSite()

    expect(result.shop.name).toBe('Cached Studio')
    expect(repository.getPublicSite).not.toHaveBeenCalled()
  })

  it('loads from repository and caches on miss', async () => {
    const payload = { shop: { name: 'Luma Nail Studio' }, services: [], staff: [], gallery: [] }
    const cache = {
      getJson: vi.fn().mockResolvedValue(null),
      setJson: vi.fn().mockResolvedValue(undefined)
    }
    const repository = { getPublicSite: vi.fn().mockResolvedValue(payload) }

    const service = new PublicSiteService(repository, cache)
    const result = await service.getPublicSite()

    expect(result).toEqual(payload)
    expect(cache.setJson).toHaveBeenCalledWith('public:site', payload, 300)
  })
})
