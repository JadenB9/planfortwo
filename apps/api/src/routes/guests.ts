import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import {
  createGuestSchema,
  updateGuestSchema,
  guestFiltersSchema,
} from '@planfortwo/validators'
import { authMiddleware } from '../middleware/auth.js'
import { resolveUserMiddleware } from '../middleware/resolve-user.js'
import { resolveWeddingMiddleware } from '../middleware/resolve-wedding.js'
import { requireFeature } from '../middleware/require-feature.js'
import { requireGuestLimit } from '../middleware/require-guest-limit.js'
import { guestService } from '../services/guests.js'

type Env = {
  Variables: {
    clerkUserId: string
    dbUserId: string
    dbUser: { id: string; email: string; firstName: string; lastName: string }
    weddingId: string
    membershipRole: string
  }
}

export const guestsRoute = new Hono<Env>()

guestsRoute.use('*', authMiddleware, resolveUserMiddleware)

// GET /guests?weddingId=X — list guests with filters
guestsRoute.get(
  '/',
  resolveWeddingMiddleware,
  zValidator('query', guestFiltersSchema, (result, c) => {
    if (!result.success) {
      return c.json(
        { error: 'Validation failed', code: 'VALIDATION_ERROR', statusCode: 400 },
        400,
      )
    }
  }),
  async (c) => {
    const filters = c.req.valid('query')
    const result = await guestService.listGuests(filters)
    return c.json(result)
  },
)

// GET /guests/stats?weddingId=X — guest statistics
guestsRoute.get(
  '/stats',
  resolveWeddingMiddleware,
  async (c) => {
    const weddingId = c.get('weddingId')
    const stats = await guestService.getStats(weddingId)
    return c.json({ data: stats })
  },
)

// GET /guests/export?weddingId=X — CSV export (gated)
guestsRoute.get(
  '/export',
  requireFeature('canDataExport'),
  resolveWeddingMiddleware,
  async (c) => {
    const weddingId = c.get('weddingId')
    const csv = await guestService.exportCsv(weddingId)
    return new Response(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="guests.csv"',
      },
    })
  },
)

// GET /guests/:id — single guest
guestsRoute.get('/:id', resolveWeddingMiddleware, async (c) => {
  const guestId = c.req.param('id')
  const weddingId = c.get('weddingId')
  const guest = await guestService.getGuest(guestId)

  if (!guest || guest.weddingId !== weddingId) {
    return c.json(
      { error: 'Guest not found', code: 'GUEST_NOT_FOUND', statusCode: 404 },
      404,
    )
  }

  return c.json({ data: guest })
})

// POST /guests — create guest (limit check)
guestsRoute.post(
  '/',
  requireGuestLimit,
  zValidator('json', createGuestSchema, (result, c) => {
    if (!result.success) {
      return c.json(
        { error: 'Validation failed', code: 'VALIDATION_ERROR', statusCode: 400 },
        400,
      )
    }
  }),
  async (c) => {
    const data = c.req.valid('json')
    const dbUserId = c.get('dbUserId')

    const guest = await guestService.createGuest(data, dbUserId)
    return c.json({ data: guest }, 201)
  },
)

// PUT /guests/:id — update guest (gated)
guestsRoute.put(
  '/:id',
  resolveWeddingMiddleware,
  requireFeature('canEditGuests'),
  zValidator('json', updateGuestSchema, (result, c) => {
    if (!result.success) {
      return c.json(
        { error: 'Validation failed', code: 'VALIDATION_ERROR', statusCode: 400 },
        400,
      )
    }
  }),
  async (c) => {
    const guestId = c.req.param('id')
    const data = c.req.valid('json')
    const dbUserId = c.get('dbUserId')
    const weddingId = c.get('weddingId')

    const updated = await guestService.updateGuest(guestId, data, dbUserId, weddingId)

    if (!updated) {
      return c.json(
        { error: 'Guest not found', code: 'GUEST_NOT_FOUND', statusCode: 404 },
        404,
      )
    }

    return c.json({ data: updated })
  },
)

// DELETE /guests/:id — delete guest (gated)
guestsRoute.delete(
  '/:id',
  resolveWeddingMiddleware,
  requireFeature('canDeleteGuests'),
  async (c) => {
    const guestId = c.req.param('id')
    const dbUserId = c.get('dbUserId')
    const weddingId = c.get('weddingId')

    try {
      await guestService.deleteGuest(guestId, dbUserId, weddingId)
      return c.json({ data: { success: true } })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Delete failed'
      return c.json(
        { error: message, code: 'DELETE_FAILED', statusCode: 404 },
        404,
      )
    }
  },
)

// POST /guests/bulk-import — CSV import (gated)
guestsRoute.post(
  '/bulk-import',
  requireFeature('canBulkImport'),
  requireGuestLimit,
  zValidator('json', z.object({
    weddingId: z.string().uuid(),
    csvContent: z.string().min(1),
  }), (result, c) => {
    if (!result.success) {
      return c.json(
        { error: 'Validation failed', code: 'VALIDATION_ERROR', statusCode: 400 },
        400,
      )
    }
  }),
  async (c) => {
    const { weddingId, csvContent } = c.req.valid('json')
    const dbUserId = c.get('dbUserId')

    const result = await guestService.bulkImportCsv(weddingId, csvContent, dbUserId)
    return c.json({ data: result })
  },
)

// POST /guests/:id/tags — assign tags to guest
guestsRoute.post(
  '/:id/tags',
  resolveWeddingMiddleware,
  zValidator('json', z.object({
    tagIds: z.array(z.string().uuid()).min(1).max(20),
  }), (result, c) => {
    if (!result.success) {
      return c.json(
        { error: 'Validation failed', code: 'VALIDATION_ERROR', statusCode: 400 },
        400,
      )
    }
  }),
  async (c) => {
    const guestId = c.req.param('id')
    const weddingId = c.get('weddingId')
    const { tagIds } = c.req.valid('json')

    const guest = await guestService.getGuest(guestId)
    if (!guest || guest.weddingId !== weddingId) {
      return c.json(
        { error: 'Guest not found', code: 'GUEST_NOT_FOUND', statusCode: 404 },
        404,
      )
    }

    await guestService.setTagsForGuest(guestId, tagIds)
    return c.json({ data: { success: true } })
  },
)

// DELETE /guests/:id/tags/:tagId — remove tag from guest
guestsRoute.delete('/:id/tags/:tagId', resolveWeddingMiddleware, async (c) => {
  const guestId = c.req.param('id')
  const tagId = c.req.param('tagId')
  const weddingId = c.get('weddingId')

  const guest = await guestService.getGuest(guestId)
  if (!guest || guest.weddingId !== weddingId) {
    return c.json(
      { error: 'Guest not found', code: 'GUEST_NOT_FOUND', statusCode: 404 },
      404,
    )
  }

  const { guestTagService } = await import('../services/guest-tags.js')
  await guestTagService.removeTag(guestId, tagId)
  return c.json({ data: { success: true } })
})
