import { Hono } from 'hono'
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'
import { authMiddleware } from '../middleware/auth.js'
import { resolveUserMiddleware } from '../middleware/resolve-user.js'
import { resolveWeddingMiddleware } from '../middleware/resolve-wedding.js'
import { activityService } from '../services/activity.js'

type Env = {
  Variables: {
    clerkUserId: string
    dbUserId: string
    dbUser: { id: string; email: string; firstName: string; lastName: string }
    weddingId: string
    membershipRole: string
  }
}

const activityQuerySchema = z.object({
  weddingId: z.string().uuid(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
})

export const activityRoute = new Hono<Env>()

activityRoute.use('*', authMiddleware, resolveUserMiddleware)

// GET /activity?weddingId=X&limit=20 — returns recent activity
activityRoute.get(
  '/',
  resolveWeddingMiddleware,
  zValidator('query', activityQuerySchema, (result, c) => {
    if (!result.success) {
      return c.json({ error: 'Validation failed', code: 'VALIDATION_ERROR', statusCode: 400 }, 400)
    }
  }),
  async (c) => {
    const weddingId = c.get('weddingId')
    const { limit } = c.req.valid('query')

    const activities = await activityService.getRecent(weddingId, limit)
    return c.json({ data: activities })
  },
)
