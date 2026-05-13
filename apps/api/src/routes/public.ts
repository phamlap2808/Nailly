import { Hono } from 'hono'
import { RedisJsonCache } from '../cache/redis'
import { createPublicSiteRepository } from '../repositories/public-site.repository'
import { PublicSiteService } from '../services/public-site.service'

import { Hono } from 'hono'
import { RedisJsonCache } from '../cache/redis'
import { createPublicSiteRepository } from '../repositories/public-site.repository'
import { PublicSiteService } from '../services/public-site.service'

export function publicRoutes(
  cache = new RedisJsonCache(),
  repository = createPublicSiteRepository()
) {
  const router = new Hono()
  const siteService = new PublicSiteService(repository, cache)

  router.get('/site', async (c) => {
    const payload = await siteService.getPublicSite()
    return c.json(payload)
  })

  return router
}
