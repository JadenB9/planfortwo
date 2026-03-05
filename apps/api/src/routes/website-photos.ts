import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import {
  requestPhotoUploadSchema,
  registerPhotoSchema,
  reorderPhotosSchema,
} from '@planfortwo/validators'
import { authMiddleware } from '../middleware/auth.js'
import { resolveUserMiddleware } from '../middleware/resolve-user.js'
import { requireFeature } from '../middleware/require-feature.js'
import { websitePhotoService } from '../services/website-photos.js'

type Env = {
  Variables: {
    clerkUserId: string
    dbUserId: string
    dbUser: { id: string; email: string; firstName: string; lastName: string }
    weddingId: string
    membershipRole: string
  }
}

export const websitePhotosRoute = new Hono<Env>()

websitePhotosRoute.use('*', authMiddleware, resolveUserMiddleware)

// POST /website-photos/upload-url — get presigned upload URL
websitePhotosRoute.post(
  '/upload-url',
  requireFeature('canWebsiteBuilder'),
  zValidator('json', requestPhotoUploadSchema, (result, c) => {
    if (!result.success) {
      return c.json({ error: 'Validation failed', code: 'VALIDATION_ERROR', statusCode: 400 }, 400)
    }
  }),
  async (c) => {
    const { weddingId, fileName, mimeType } = c.req.valid('json')
    const result = await websitePhotoService.getUploadUrl(weddingId, fileName, mimeType)
    return c.json({ data: result })
  },
)

// POST /website-photos — register uploaded photo
websitePhotosRoute.post(
  '/',
  requireFeature('canWebsiteBuilder'),
  zValidator('json', registerPhotoSchema, (result, c) => {
    if (!result.success) {
      return c.json({ error: 'Validation failed', code: 'VALIDATION_ERROR', statusCode: 400 }, 400)
    }
  }),
  async (c) => {
    const data = c.req.valid('json')
    const photo = await websitePhotoService.register(data)
    return c.json({ data: photo }, 201)
  },
)

// DELETE /website-photos/:id?weddingId=X
websitePhotosRoute.delete('/:id', requireFeature('canWebsiteBuilder'), async (c) => {
  const id = c.req.param('id')
  const weddingId = c.req.query('weddingId')
  if (!weddingId) {
    return c.json(
      { error: 'Wedding ID required', code: 'MISSING_WEDDING_ID', statusCode: 400 },
      400,
    )
  }

  try {
    await websitePhotoService.delete(id, weddingId)
    return c.json({ data: { success: true } })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Delete failed'
    return c.json({ error: message, code: 'DELETE_FAILED', statusCode: 404 }, 404)
  }
})

// POST /website-photos/reorder
websitePhotosRoute.post(
  '/reorder',
  requireFeature('canWebsiteBuilder'),
  zValidator('json', reorderPhotosSchema, (result, c) => {
    if (!result.success) {
      return c.json({ error: 'Validation failed', code: 'VALIDATION_ERROR', statusCode: 400 }, 400)
    }
  }),
  async (c) => {
    const { photos } = c.req.valid('json')
    const weddingId = c.req.query('weddingId')
    if (!weddingId) {
      return c.json(
        { error: 'Wedding ID required', code: 'MISSING_WEDDING_ID', statusCode: 400 },
        400,
      )
    }

    await websitePhotoService.reorder(weddingId, photos)
    return c.json({ data: { success: true } })
  },
)
