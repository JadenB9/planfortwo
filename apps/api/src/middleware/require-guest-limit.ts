import { createMiddleware } from 'hono/factory'
import { eq, count } from 'drizzle-orm'
import { db, guests } from '@planfortwo/db'
import { featureService } from '../services/features.js'

type GuestLimitEnv = {
  Variables: {
    dbUserId: string
  }
}

export const requireGuestLimit = createMiddleware<GuestLimitEnv>(async (c, next) => {
  // Prefer weddingId from context (set by resolveWeddingMiddleware), then query/param.
  // Never read from body — it consumes the stream and breaks downstream validators.
  const weddingId =
    (c.get('weddingId' as never) as string | undefined) ??
    c.req.query('weddingId') ??
    c.req.param('weddingId')

  if (!weddingId || typeof weddingId !== 'string') {
    return c.json(
      { error: 'Wedding ID required', code: 'MISSING_WEDDING_ID', statusCode: 400 },
      400,
    )
  }

  const gates = await featureService.getFeatures(weddingId)

  if (gates.maxGuests !== null) {
    // Use direct DB query to avoid circular dependency with guestService
    const [result] = await db
      .select({ cnt: count() })
      .from(guests)
      .where(eq(guests.weddingId, weddingId))

    const currentCount = result?.cnt ?? 0

    if (currentCount >= gates.maxGuests) {
      return c.json(
        {
          error: `Guest limit reached (${gates.maxGuests}). Upgrade to add more guests.`,
          code: 'GUEST_LIMIT_REACHED',
          statusCode: 403,
        },
        403,
      )
    }
  }

  await next()
})
