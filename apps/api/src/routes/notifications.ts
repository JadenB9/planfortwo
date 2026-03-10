import { Hono } from 'hono'
import { authMiddleware } from '../middleware/auth.js'
import { resolveUserMiddleware } from '../middleware/resolve-user.js'
import { resolveWeddingMiddleware } from '../middleware/resolve-wedding.js'
import { notificationsService } from '../services/notifications.js'

type Env = {
  Variables: {
    clerkUserId: string
    dbUserId: string
    dbUser: { id: string; email: string; firstName: string; lastName: string }
    weddingId: string
    membershipRole: string
  }
}

export const notificationsRoute = new Hono<Env>()

notificationsRoute.get(
  '/badges',
  authMiddleware,
  resolveUserMiddleware,
  resolveWeddingMiddleware,
  async (c) => {
    const weddingId = c.get('weddingId')
    const userId = c.get('dbUserId')
    const counts = await notificationsService.getBadgeCounts(weddingId, userId)
    return c.json({ data: counts })
  },
)
