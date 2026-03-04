import { Hono } from 'hono'
import { authMiddleware } from '../middleware/auth.js'
import { resolveUserMiddleware } from '../middleware/resolve-user.js'
import { resolveWeddingMiddleware } from '../middleware/resolve-wedding.js'
import { requireFeature } from '../middleware/require-feature.js'
import { websiteAnalyticsService } from '../services/website-analytics.js'

type Env = {
  Variables: {
    clerkUserId: string
    dbUserId: string
    dbUser: { id: string; email: string; firstName: string; lastName: string }
    weddingId: string
    membershipRole: string
  }
}

export const websiteAnalyticsRoute = new Hono<Env>()

websiteAnalyticsRoute.use('*', authMiddleware, resolveUserMiddleware)

// GET /website-analytics?weddingId=X
websiteAnalyticsRoute.get(
  '/',
  resolveWeddingMiddleware,
  requireFeature('canWebsiteAnalytics'),
  async (c) => {
    const weddingId = c.get('weddingId')
    const summary = await websiteAnalyticsService.getSummary(weddingId)
    return c.json({ data: summary })
  },
)
