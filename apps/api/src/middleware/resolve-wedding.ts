import { createMiddleware } from 'hono/factory'
import { weddingService } from '../services/weddings.js'

type WeddingEnv = {
  Variables: {
    dbUserId: string
    weddingId: string
    membershipRole: string
  }
}

export const resolveWeddingMiddleware = createMiddleware<WeddingEnv>(async (c, next) => {
  const weddingId = c.req.query('weddingId') ?? c.req.param('weddingId')

  if (!weddingId) {
    return c.json(
      { error: 'Wedding ID required', code: 'MISSING_WEDDING_ID', statusCode: 400 },
      400,
    )
  }

  const dbUserId = c.get('dbUserId')
  const membership = await weddingService.verifyMembership(weddingId, dbUserId)

  if (!membership) {
    return c.json(
      { error: 'Not a member of this wedding', code: 'FORBIDDEN', statusCode: 403 },
      403,
    )
  }

  c.set('weddingId', weddingId)
  c.set('membershipRole', membership.role)

  await next()
})
