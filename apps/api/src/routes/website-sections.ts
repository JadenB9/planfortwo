import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import {
  updateWebsiteSectionSchema,
  reorderWebsiteSectionsSchema,
  createCustomSectionSchema,
} from '@planfortwo/validators'
import { authMiddleware } from '../middleware/auth.js'
import { resolveUserMiddleware } from '../middleware/resolve-user.js'
import { resolveWeddingMiddleware } from '../middleware/resolve-wedding.js'
import { requireFeature } from '../middleware/require-feature.js'
import { websiteSectionService } from '../services/website-sections.js'

type Env = {
  Variables: {
    clerkUserId: string
    dbUserId: string
    dbUser: { id: string; email: string; firstName: string; lastName: string }
    weddingId: string
    membershipRole: string
  }
}

export const websiteSectionsRoute = new Hono<Env>()

websiteSectionsRoute.use('*', authMiddleware, resolveUserMiddleware)

// GET /website-sections?weddingId=X
websiteSectionsRoute.get('/', resolveWeddingMiddleware, async (c) => {
  const weddingId = c.get('weddingId')
  const sections = await websiteSectionService.list(weddingId)
  return c.json({ data: sections })
})

// GET /website-sections/:id?weddingId=X
websiteSectionsRoute.get('/:id', resolveWeddingMiddleware, async (c) => {
  const id = c.req.param('id')
  const weddingId = c.get('weddingId')
  const section = await websiteSectionService.get(id, weddingId)

  if (!section) {
    return c.json({ error: 'Section not found', code: 'NOT_FOUND', statusCode: 404 }, 404)
  }
  return c.json({ data: section })
})

// PUT /website-sections/:id?weddingId=X
websiteSectionsRoute.put(
  '/:id',
  requireFeature('canWebsiteBuilder'),
  zValidator('json', updateWebsiteSectionSchema, (result, c) => {
    if (!result.success) {
      return c.json({ error: 'Validation failed', code: 'VALIDATION_ERROR', statusCode: 400 }, 400)
    }
  }),
  async (c) => {
    const id = c.req.param('id')
    const weddingId = c.req.query('weddingId')
    if (!weddingId) {
      return c.json({ error: 'Wedding ID required', code: 'MISSING_WEDDING_ID', statusCode: 400 }, 400)
    }

    const data = c.req.valid('json')
    const updated = await websiteSectionService.update(id, weddingId, data, c.get('dbUserId'))

    if (!updated) {
      return c.json({ error: 'Section not found', code: 'NOT_FOUND', statusCode: 404 }, 404)
    }
    return c.json({ data: updated })
  },
)

// POST /website-sections/reorder?weddingId=X
websiteSectionsRoute.post(
  '/reorder',
  zValidator('json', reorderWebsiteSectionsSchema, (result, c) => {
    if (!result.success) {
      return c.json({ error: 'Validation failed', code: 'VALIDATION_ERROR', statusCode: 400 }, 400)
    }
  }),
  async (c) => {
    const weddingId = c.req.query('weddingId')
    if (!weddingId) {
      return c.json({ error: 'Wedding ID required', code: 'MISSING_WEDDING_ID', statusCode: 400 }, 400)
    }

    const { sections } = c.req.valid('json')
    await websiteSectionService.reorder(weddingId, sections)
    return c.json({ data: { success: true } })
  },
)

// POST /website-sections (custom section, gated)
websiteSectionsRoute.post(
  '/',
  requireFeature('canWebsiteCustomSections'),
  zValidator('json', createCustomSectionSchema, (result, c) => {
    if (!result.success) {
      return c.json({ error: 'Validation failed', code: 'VALIDATION_ERROR', statusCode: 400 }, 400)
    }
  }),
  async (c) => {
    const data = c.req.valid('json')
    const section = await websiteSectionService.createCustom(
      data.weddingId,
      data.title,
      data.content as Record<string, unknown> | undefined,
      c.get('dbUserId'),
    )
    return c.json({ data: section }, 201)
  },
)

// DELETE /website-sections/:id?weddingId=X (custom only, gated)
websiteSectionsRoute.delete(
  '/:id',
  requireFeature('canWebsiteCustomSections'),
  async (c) => {
    const id = c.req.param('id')
    const weddingId = c.req.query('weddingId')
    if (!weddingId) {
      return c.json({ error: 'Wedding ID required', code: 'MISSING_WEDDING_ID', statusCode: 400 }, 400)
    }

    try {
      await websiteSectionService.deleteCustom(id, weddingId)
      return c.json({ data: { success: true } })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Delete failed'
      return c.json({ error: message, code: 'DELETE_FAILED', statusCode: 400 }, 400)
    }
  },
)
