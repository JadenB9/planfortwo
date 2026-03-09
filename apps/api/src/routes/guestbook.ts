import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { createGuestbookEntrySchema } from '@planfortwo/validators'
import { z } from 'zod'
import { authMiddleware } from '../middleware/auth.js'
import { resolveUserMiddleware } from '../middleware/resolve-user.js'
import { resolveWeddingMiddleware } from '../middleware/resolve-wedding.js'
import { guestbookService } from '../services/guestbook.js'

type Env = {
  Variables: {
    clerkUserId: string
    dbUserId: string
    dbUser: { id: string; email: string; firstName: string; lastName: string }
    weddingId: string
    membershipRole: string
  }
}

export const guestbookRoute = new Hono<Env>()

// POST /guestbook — public submission (no auth)
guestbookRoute.post(
  '/',
  zValidator('json', createGuestbookEntrySchema, (result, c) => {
    if (!result.success) {
      return c.json({ error: 'Validation failed', code: 'VALIDATION_ERROR', statusCode: 400 }, 400)
    }
  }),
  async (c) => {
    const data = c.req.valid('json')
    if (data.website) {
      return c.json(
        {
          data: { id: 'ok', authorName: data.authorName, message: data.message, isVisible: false },
        },
        201,
      )
    }
    const entry = await guestbookService.create(data)
    return c.json({ data: entry }, 201)
  },
)

// GET /guestbook?weddingId=X — admin list (auth required)
guestbookRoute.get(
  '/',
  authMiddleware,
  resolveUserMiddleware,
  resolveWeddingMiddleware,
  async (c) => {
    const weddingId = c.get('weddingId')
    const entries = await guestbookService.list(weddingId)
    return c.json({ data: entries })
  },
)

// PUT /guestbook/:id/approve?weddingId=X
guestbookRoute.put(
  '/:id/approve',
  authMiddleware,
  resolveUserMiddleware,
  resolveWeddingMiddleware,
  zValidator('json', z.object({ approved: z.boolean() }), (result, c) => {
    if (!result.success) {
      return c.json({ error: 'Validation failed', code: 'VALIDATION_ERROR', statusCode: 400 }, 400)
    }
  }),
  async (c) => {
    const id = c.req.param('id')
    const weddingId = c.get('weddingId')

    const { approved } = c.req.valid('json')
    const updated = await guestbookService.approve(id, weddingId, approved)
    if (!updated) {
      return c.json({ error: 'Entry not found', code: 'NOT_FOUND', statusCode: 404 }, 404)
    }
    return c.json({ data: updated })
  },
)

// DELETE /guestbook/:id?weddingId=X
guestbookRoute.delete(
  '/:id',
  authMiddleware,
  resolveUserMiddleware,
  resolveWeddingMiddleware,
  async (c) => {
    const id = c.req.param('id')
    const weddingId = c.get('weddingId')

    try {
      await guestbookService.delete(id, weddingId)
      return c.json({ data: { success: true } })
    } catch (err) {
      console.error('Delete guestbook entry failed:', err)
      return c.json({ error: 'Delete failed', code: 'DELETE_FAILED', statusCode: 404 }, 404)
    }
  },
)
