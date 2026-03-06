import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import {
  createPhotoSchema,
  updatePhotoSchema,
  moderatePhotoSchema,
  requestGalleryUploadSchema,
} from '@planfortwo/validators'
import { authMiddleware } from '../middleware/auth.js'
import { resolveUserMiddleware } from '../middleware/resolve-user.js'
import { resolveWeddingMiddleware } from '../middleware/resolve-wedding.js'
import { photoGalleryService } from '../services/photo-gallery.js'

type Env = {
  Variables: {
    clerkUserId: string
    dbUserId: string
    dbUser: { id: string; email: string; firstName: string; lastName: string }
    weddingId: string
    membershipRole: string
  }
}

export const photoGalleryRoute = new Hono<Env>()

photoGalleryRoute.use('*', authMiddleware, resolveUserMiddleware)

photoGalleryRoute.get('/', resolveWeddingMiddleware, async (c) => {
  const weddingId = c.get('weddingId')
  const list = await photoGalleryService.list(weddingId)
  return c.json({ data: list })
})

photoGalleryRoute.post(
  '/upload-url',
  resolveWeddingMiddleware,
  zValidator('json', requestGalleryUploadSchema, (result, c) => {
    if (!result.success)
      return c.json({ error: 'Validation failed', code: 'VALIDATION_ERROR', statusCode: 400 }, 400)
  }),
  async (c) => {
    const { weddingId, fileName, mimeType } = c.req.valid('json')
    const result = await photoGalleryService.getUploadUrl(weddingId, fileName, mimeType)
    return c.json({ data: result })
  },
)

photoGalleryRoute.get('/:id', resolveWeddingMiddleware, async (c) => {
  const photoId = c.req.param('id')
  const weddingId = c.get('weddingId')
  const photo = await photoGalleryService.getById(photoId, weddingId)
  if (!photo) return c.json({ error: 'Photo not found', code: 'NOT_FOUND', statusCode: 404 }, 404)
  return c.json({ data: photo })
})

photoGalleryRoute.post(
  '/',
  resolveWeddingMiddleware,
  zValidator('json', createPhotoSchema, (result, c) => {
    if (!result.success)
      return c.json({ error: 'Validation failed', code: 'VALIDATION_ERROR', statusCode: 400 }, 400)
  }),
  async (c) => {
    const data = c.req.valid('json')
    const photo = await photoGalleryService.create(data)
    return c.json({ data: photo }, 201)
  },
)

photoGalleryRoute.put(
  '/:id',
  resolveWeddingMiddleware,
  zValidator('json', updatePhotoSchema, (result, c) => {
    if (!result.success)
      return c.json({ error: 'Validation failed', code: 'VALIDATION_ERROR', statusCode: 400 }, 400)
  }),
  async (c) => {
    const photoId = c.req.param('id')
    const weddingId = c.get('weddingId')
    const data = c.req.valid('json')
    const updated = await photoGalleryService.update(photoId, weddingId, data)
    if (!updated)
      return c.json({ error: 'Photo not found', code: 'NOT_FOUND', statusCode: 404 }, 404)
    return c.json({ data: updated })
  },
)

photoGalleryRoute.delete('/:id', resolveWeddingMiddleware, async (c) => {
  const photoId = c.req.param('id')
  const weddingId = c.get('weddingId')
  const deleted = await photoGalleryService.delete(photoId, weddingId)
  if (!deleted) return c.json({ error: 'Photo not found', code: 'NOT_FOUND', statusCode: 404 }, 404)
  return c.json({ data: { success: true } })
})

photoGalleryRoute.post(
  '/:id/moderate',
  resolveWeddingMiddleware,
  zValidator('json', moderatePhotoSchema, (result, c) => {
    if (!result.success)
      return c.json({ error: 'Validation failed', code: 'VALIDATION_ERROR', statusCode: 400 }, 400)
  }),
  async (c) => {
    const photoId = c.req.param('id')
    const weddingId = c.get('weddingId')
    const { status } = c.req.valid('json')
    const updated = await photoGalleryService.moderate(photoId, weddingId, status)
    if (!updated)
      return c.json({ error: 'Photo not found', code: 'NOT_FOUND', statusCode: 404 }, 404)
    return c.json({ data: updated })
  },
)
