import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { createGuestTagSchema } from '@planfortwo/validators'
import { authMiddleware } from '../middleware/auth.js'
import { resolveUserMiddleware } from '../middleware/resolve-user.js'
import { resolveWeddingMiddleware } from '../middleware/resolve-wedding.js'
import { guestTagService } from '../services/guest-tags.js'

type Env = {
  Variables: {
    clerkUserId: string
    dbUserId: string
    dbUser: { id: string; email: string; firstName: string; lastName: string }
    weddingId: string
    membershipRole: string
  }
}

export const guestTagsRoute = new Hono<Env>()

guestTagsRoute.use('*', authMiddleware, resolveUserMiddleware)

// GET /guest-tags?weddingId=X — list all tags for wedding
guestTagsRoute.get(
  '/',
  resolveWeddingMiddleware,
  async (c) => {
    const weddingId = c.get('weddingId')
    const tags = await guestTagService.listTags(weddingId)
    return c.json({ data: tags })
  },
)

// POST /guest-tags — create tag
guestTagsRoute.post(
  '/',
  zValidator('json', createGuestTagSchema, (result, c) => {
    if (!result.success) {
      return c.json(
        { error: 'Validation failed', code: 'VALIDATION_ERROR', statusCode: 400 },
        400,
      )
    }
  }),
  async (c) => {
    const data = c.req.valid('json')
    const tag = await guestTagService.createTag(data)
    return c.json({ data: tag }, 201)
  },
)

// DELETE /guest-tags/:id — delete tag
guestTagsRoute.delete('/:id', async (c) => {
  const id = c.req.param('id')

  try {
    await guestTagService.deleteTag(id)
    return c.json({ data: { success: true } })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Delete failed'
    return c.json(
      { error: message, code: 'DELETE_FAILED', statusCode: 404 },
      404,
    )
  }
})
