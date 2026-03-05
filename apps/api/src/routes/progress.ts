import { Hono } from 'hono'
import { authMiddleware } from '../middleware/auth.js'
import { resolveUserMiddleware } from '../middleware/resolve-user.js'
import { weddingService } from '../services/weddings.js'
import { progressService } from '../services/progress.js'

type Env = {
  Variables: {
    clerkUserId: string
    dbUserId: string
    dbUser: { id: string; email: string; firstName: string; lastName: string }
  }
}

export const progressRoute = new Hono<Env>()
progressRoute.use('*', authMiddleware, resolveUserMiddleware)

progressRoute.get('/', async (c) => {
  const weddingId = c.req.query('weddingId')
  if (!weddingId) {
    return c.json(
      { error: 'weddingId is required', code: 'VALIDATION_ERROR', statusCode: 400 },
      400,
    )
  }

  const dbUserId = c.get('dbUserId')
  const membership = await weddingService.verifyMembership(weddingId, dbUserId)
  if (!membership) {
    return c.json({ error: 'Not a member', code: 'FORBIDDEN', statusCode: 403 }, 403)
  }

  const progress = await progressService.getProgress(weddingId)
  return c.json({ data: progress })
})
