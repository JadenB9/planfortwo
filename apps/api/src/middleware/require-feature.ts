import { createMiddleware } from 'hono/factory'
import { featureService } from '../services/features.js'
import type { FeatureGates } from '@planfortwo/types'

type FeatureEnv = {
  Variables: {
    dbUserId: string
  }
}

export function requireFeature(feature: keyof FeatureGates) {
  return createMiddleware<FeatureEnv>(async (c, next) => {
    // Only use weddingId from context (set by resolveWeddingMiddleware).
    // Never fall back to query/param — attacker could supply a full-tier weddingId they don't own.
    const weddingId = c.get('weddingId' as never) as string | undefined

    if (!weddingId) {
      return c.json(
        { error: 'Internal configuration error', code: 'MIDDLEWARE_ORDER', statusCode: 500 },
        500,
      )
    }

    const gates = await featureService.getFeatures(weddingId)

    if (!gates[feature]) {
      return c.json({ error: 'Upgrade required', code: 'FEATURE_LOCKED', statusCode: 403 }, 403)
    }

    await next()
  })
}
