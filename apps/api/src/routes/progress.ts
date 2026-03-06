import { Hono } from 'hono'
import { authMiddleware } from '../middleware/auth.js'
import { resolveUserMiddleware } from '../middleware/resolve-user.js'
import { weddingService } from '../services/weddings.js'
import { progressService } from '../services/progress.js'
import { updateRoadmapPreferencesSchema } from '@planfortwo/validators'

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

progressRoute.put('/preferences', async (c) => {
  const dbUserId = c.get('dbUserId')
  const body = await c.req.json()
  const parsed = updateRoadmapPreferencesSchema.safeParse(body)
  if (!parsed.success) {
    return c.json(
      {
        error: parsed.error.errors[0]?.message ?? 'Invalid input',
        code: 'VALIDATION_ERROR',
        statusCode: 400,
      },
      400,
    )
  }

  const { weddingId, overrides, hidden } = parsed.data
  const membership = await weddingService.verifyMembership(weddingId, dbUserId)
  if (!membership) {
    return c.json({ error: 'Not a member', code: 'FORBIDDEN', statusCode: 403 }, 403)
  }

  const preferences = await progressService.upsertPreferences(weddingId, { overrides, hidden })
  return c.json({ data: preferences })
})
