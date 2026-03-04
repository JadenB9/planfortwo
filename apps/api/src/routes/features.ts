import { Hono } from 'hono'
import { authMiddleware } from '../middleware/auth.js'
import { resolveUserMiddleware } from '../middleware/resolve-user.js'
import { resolveWeddingMiddleware } from '../middleware/resolve-wedding.js'
import { featureService } from '../services/features.js'

type Env = {
  Variables: {
    clerkUserId: string
    dbUserId: string
    dbUser: { id: string; email: string; firstName: string; lastName: string }
    weddingId: string
    membershipRole: string
  }
}

export const featuresRoute = new Hono<Env>()

featuresRoute.use('*', authMiddleware, resolveUserMiddleware)

// GET /features?weddingId=X — returns FeatureGates
featuresRoute.get('/', resolveWeddingMiddleware, async (c) => {
  const weddingId = c.get('weddingId')
  const gates = await featureService.getFeatures(weddingId)
  return c.json({ data: gates })
})
