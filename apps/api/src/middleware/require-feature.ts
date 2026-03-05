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

    if (!gates[feature]) {
      return c.json({ error: 'Upgrade required', code: 'FEATURE_LOCKED', statusCode: 403 }, 403)
    }

    await next()
  })
}
