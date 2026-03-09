import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import {
  requestPhotoUploadSchema,
  registerPhotoSchema,
  reorderPhotosSchema,
} from '@planfortwo/validators'
import { authMiddleware } from '../middleware/auth.js'
import { resolveUserMiddleware } from '../middleware/resolve-user.js'
import { resolveWeddingMiddleware } from '../middleware/resolve-wedding.js'
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
  resolveWeddingMiddleware,
  requireFeature('canWebsiteBuilder'),
  zValidator('json', requestPhotoUploadSchema, (result, c) => {
    if (!result.success) {
      return c.json({ error: 'Validation failed', code: 'VALIDATION_ERROR', statusCode: 400 }, 400)
    }
  }),
  async (c) => {
    const { fileName, mimeType } = c.req.valid('json')
    const weddingId = c.get('weddingId')
    const result = await websitePhotoService.getUploadUrl(weddingId, fileName, mimeType)
    return c.json({ data: result })
  },
)

// POST /website-photos — register uploaded photo
websitePhotosRoute.post(
  '/',
  resolveWeddingMiddleware,
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
websitePhotosRoute.delete(
  '/:id',
  resolveWeddingMiddleware,
  requireFeature('canWebsiteBuilder'),
  async (c) => {
    const id = c.req.param('id')
    const weddingId = c.get('weddingId')

    try {
      await websitePhotoService.delete(id, weddingId)
      return c.json({ data: { success: true } })
    } catch (err) {
      console.error('Delete website photo failed:', err)
      return c.json({ error: 'Delete failed', code: 'DELETE_FAILED', statusCode: 404 }, 404)
    }
  },
)

// POST /website-photos/reorder
websitePhotosRoute.post(
  '/reorder',
  resolveWeddingMiddleware,
  requireFeature('canWebsiteBuilder'),
  zValidator('json', reorderPhotosSchema, (result, c) => {
    if (!result.success) {
      return c.json({ error: 'Validation failed', code: 'VALIDATION_ERROR', statusCode: 400 }, 400)
    }
  }),
  async (c) => {
    const { photos } = c.req.valid('json')
    const weddingId = c.get('weddingId')

    await websitePhotoService.reorder(weddingId, photos)
    return c.json({ data: { success: true } })
  },
)
