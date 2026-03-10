import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { authMiddleware } from '../middleware/auth.js'
import { resolveUserMiddleware } from '../middleware/resolve-user.js'
import { resolveWeddingMiddleware } from '../middleware/resolve-wedding.js'
import { prayersService } from '../services/prayers.js'

type Env = {
  Variables: {
    clerkUserId: string
    dbUserId: string
    dbUser: { id: string; email: string; firstName: string; lastName: string }
    weddingId: string
    membershipRole: string
  }
}

export const prayersRoute = new Hono<Env>()

// GET /prayers?weddingId=X — admin list (auth required)
prayersRoute.get(
  '/',
  authMiddleware,
  resolveUserMiddleware,
  resolveWeddingMiddleware,
  async (c) => {
    const weddingId = c.get('weddingId')
    const entries = await prayersService.list(weddingId)
    return c.json({ data: entries })
  },
)

// PUT /prayers/:id/approve?weddingId=X
prayersRoute.put(
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
    const updated = await prayersService.approve(id, weddingId, approved)
    if (!updated) {
      return c.json({ error: 'Prayer not found', code: 'NOT_FOUND', statusCode: 404 }, 404)
    }
    return c.json({ data: updated })
  },
)

// DELETE /prayers/:id?weddingId=X
prayersRoute.delete(
  '/:id',
  authMiddleware,
  resolveUserMiddleware,
  resolveWeddingMiddleware,
  async (c) => {
    const id = c.req.param('id')
    const weddingId = c.get('weddingId')

    try {
      await prayersService.delete(id, weddingId)
      return c.json({ data: { success: true } })
    } catch (err) {
      console.error('Delete prayer failed:', err)
      return c.json({ error: 'Delete failed', code: 'DELETE_FAILED', statusCode: 404 }, 404)
    }
  },
)
