import type { JsonCache } from '../cache/redis'
import type { PublicSitePayload } from '../repositories/public-site.repository'

const PUBLIC_SITE_CACHE_KEY = 'public:site'

export class PublicSiteService {
  constructor(
    private readonly repository: { getPublicSite(): Promise<PublicSitePayload> },
    private readonly cache: Pick<JsonCache, 'getJson' | 'setJson'>
  ) {}

  async getPublicSite(): Promise<PublicSitePayload> {
    const cached = await this.cache.getJson<PublicSitePayload>(PUBLIC_SITE_CACHE_KEY)
    if (cached) return cached

    const payload = await this.repository.getPublicSite()
    await this.cache.setJson(PUBLIC_SITE_CACHE_KEY, payload, 300)
    return payload
  }
}
