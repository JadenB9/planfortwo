import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import {
  createWebsiteConfigSchema,
  updateWebsiteConfigSchema,
  websitePasswordSchema,
  subdomainSchema,
} from '@planfortwo/validators'
import { z } from 'zod'
import { authMiddleware } from '../middleware/auth.js'
import { resolveUserMiddleware } from '../middleware/resolve-user.js'
import { resolveWeddingMiddleware } from '../middleware/resolve-wedding.js'
import { requireFeature } from '../middleware/require-feature.js'
import { websiteConfigService } from '../services/website-config.js'

type Env = {
  Variables: {
    clerkUserId: string
    dbUserId: string
    dbUser: { id: string; email: string; firstName: string; lastName: string }
    weddingId: string
    membershipRole: string
  }
}

export const websiteConfigRoute = new Hono<Env>()

// GET /website-config?weddingId=X
websiteConfigRoute.get(
  '/',
  authMiddleware,
  resolveUserMiddleware,
  resolveWeddingMiddleware,
  async (c) => {
    const weddingId = c.get('weddingId')
    const config = await websiteConfigService.get(weddingId)
    return c.json({ data: config })
  },
)

// POST /website-config
websiteConfigRoute.post(
  '/',
  authMiddleware,
  resolveUserMiddleware,
  resolveWeddingMiddleware,
  requireFeature('canWebsiteBuilder'),
  zValidator('json', createWebsiteConfigSchema, (result, c) => {
    if (!result.success) {
      return c.json({ error: 'Validation failed', code: 'VALIDATION_ERROR', statusCode: 400 }, 400)
    }
  }),
  async (c) => {
    const data = c.req.valid('json')
    const dbUserId = c.get('dbUserId')

    try {
      const config = await websiteConfigService.create(data, dbUserId)
      return c.json({ data: config }, 201)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Create failed'
      if (message.includes('already exists')) {
        return c.json({ error: message, code: 'ALREADY_EXISTS', statusCode: 409 }, 409)
      }
      return c.json({ error: message, code: 'CREATE_FAILED', statusCode: 400 }, 400)
    }
  },
)

// PUT /website-config/:id?weddingId=X
websiteConfigRoute.put(
  '/:id',
  authMiddleware,
  resolveUserMiddleware,
  resolveWeddingMiddleware,
  requireFeature('canWebsiteBuilder'),
  zValidator('json', updateWebsiteConfigSchema, (result, c) => {
    if (!result.success) {
      return c.json({ error: 'Validation failed', code: 'VALIDATION_ERROR', statusCode: 400 }, 400)
    }
  }),
  async (c) => {
    const id = c.req.param('id')
    const weddingId = c.get('weddingId')

    const data = c.req.valid('json')
    const updated = await websiteConfigService.update(id, weddingId, data)

    if (!updated) {
      return c.json({ error: 'Config not found', code: 'NOT_FOUND', statusCode: 404 }, 404)
    }

    return c.json({ data: updated })
  },
)

// POST /website-config/:id/publish
websiteConfigRoute.post(
  '/:id/publish',
  authMiddleware,
  resolveUserMiddleware,
  resolveWeddingMiddleware,
  requireFeature('canWebsiteBuilder'),
  async (c) => {
    const id = c.req.param('id')
    const weddingId = c.get('weddingId')

    const updated = await websiteConfigService.publish(id, weddingId, c.get('dbUserId'))
    if (!updated) {
      return c.json({ error: 'Config not found', code: 'NOT_FOUND', statusCode: 404 }, 404)
    }
    return c.json({ data: updated })
  },
)

// POST /website-config/:id/unpublish
websiteConfigRoute.post(
  '/:id/unpublish',
  authMiddleware,
  resolveUserMiddleware,
  resolveWeddingMiddleware,
  requireFeature('canWebsiteBuilder'),
  async (c) => {
    const id = c.req.param('id')
    const weddingId = c.get('weddingId')

    const updated = await websiteConfigService.unpublish(id, weddingId, c.get('dbUserId'))
    if (!updated) {
      return c.json({ error: 'Config not found', code: 'NOT_FOUND', statusCode: 404 }, 404)
    }
    return c.json({ data: updated })
  },
)

// POST /website-config/:id/set-password
websiteConfigRoute.post(
  '/:id/set-password',
  authMiddleware,
  resolveUserMiddleware,
  resolveWeddingMiddleware,
  requireFeature('canWebsiteBuilder'),
  zValidator('json', websitePasswordSchema, (result, c) => {
    if (!result.success) {
      return c.json({ error: 'Validation failed', code: 'VALIDATION_ERROR', statusCode: 400 }, 400)
    }
  }),
  async (c) => {
    const id = c.req.param('id')
    const weddingId = c.get('weddingId')

    const { password } = c.req.valid('json')
    const updated = await websiteConfigService.setPassword(id, weddingId, password)
    if (!updated) {
      return c.json({ error: 'Config not found', code: 'NOT_FOUND', statusCode: 404 }, 404)
    }
    return c.json({ data: { success: true } })
  },
)

// POST /website-config/verify-password (public)
websiteConfigRoute.post(
  '/verify-password',
  zValidator(
    'json',
    z.object({
      subdomain: z.string().min(1),
      password: z.string().min(1),
    }),
    (result, c) => {
      if (!result.success) {
        return c.json(
          { error: 'Validation failed', code: 'VALIDATION_ERROR', statusCode: 400 },
          400,
        )
      }
    },
  ),
  async (c) => {
    const { subdomain, password } = c.req.valid('json')
    const valid = await websiteConfigService.verifyPassword(subdomain, password)
    return c.json({ data: { valid } })
  },
)

// GET /website-config/check-subdomain?subdomain=X
websiteConfigRoute.get('/check-subdomain', authMiddleware, resolveUserMiddleware, async (c) => {
  const subdomain = c.req.query('subdomain')
  if (!subdomain) {
    return c.json({ error: 'Subdomain required', code: 'MISSING_SUBDOMAIN', statusCode: 400 }, 400)
  }

  const parsed = subdomainSchema.safeParse(subdomain)
  if (!parsed.success) {
    return c.json({ data: { available: false, reason: 'Invalid format' } })
  }

  const available = await websiteConfigService.checkSubdomain(subdomain)
  return c.json({ data: { available } })
})
