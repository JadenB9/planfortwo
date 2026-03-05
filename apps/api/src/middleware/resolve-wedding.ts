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
  let weddingId = c.req.query('weddingId') ?? c.req.param('weddingId')

  // For POST/PUT/PATCH with JSON body, also check body for weddingId
  if (!weddingId) {
    const method = c.req.method.toUpperCase()
    const contentType = c.req.header('content-type') ?? ''
    if (['POST', 'PUT', 'PATCH'].includes(method) && contentType.includes('application/json')) {
      try {
        const body = await c.req.json()
        weddingId = body?.weddingId
      } catch {
        // body parse failed — fall through to missing ID error
      }
    }
  }

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
