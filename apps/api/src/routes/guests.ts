import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { createGuestSchema, updateGuestSchema, guestFiltersSchema } from '@planfortwo/validators'
import { authMiddleware } from '../middleware/auth.js'
import { resolveUserMiddleware } from '../middleware/resolve-user.js'
import { resolveWeddingMiddleware } from '../middleware/resolve-wedding.js'
import { requireFeature } from '../middleware/require-feature.js'
import { requireGuestLimit } from '../middleware/require-guest-limit.js'
import { guestService } from '../services/guests.js'
import { guestTagService } from '../services/guest-tags.js'
import { emailService } from '../services/email.js'
import { db, weddings } from '@planfortwo/db'
import { eq } from 'drizzle-orm'

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
      return c.json({ error: 'Validation failed', code: 'VALIDATION_ERROR', statusCode: 400 }, 400)
    }
  }),
  async (c) => {
    const filters = c.req.valid('query')
    const result = await guestService.listGuests(filters)
    return c.json(result)
  },
)

// GET /guests/stats?weddingId=X — guest statistics
guestsRoute.get('/stats', resolveWeddingMiddleware, async (c) => {
  const weddingId = c.get('weddingId')
  const stats = await guestService.getStats(weddingId)
  return c.json({ data: stats })
})

// GET /guests/export?weddingId=X — CSV export (gated)
guestsRoute.get('/export', resolveWeddingMiddleware, requireFeature('canDataExport'), async (c) => {
  const weddingId = c.get('weddingId')
  const csv = await guestService.exportCsv(weddingId)
  return new Response(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': 'attachment; filename="guests.csv"',
    },
  })
})

// GET /guests/:id — single guest
guestsRoute.get('/:id', resolveWeddingMiddleware, async (c) => {
  const guestId = c.req.param('id')
  const weddingId = c.get('weddingId')
  const guest = await guestService.getGuest(guestId)

  if (!guest || guest.weddingId !== weddingId) {
    return c.json({ error: 'Guest not found', code: 'GUEST_NOT_FOUND', statusCode: 404 }, 404)
  }

  return c.json({ data: guest })
})

// POST /guests — create guest (limit check)
guestsRoute.post(
  '/',
  resolveWeddingMiddleware,
  requireGuestLimit,
  zValidator('json', createGuestSchema, (result, c) => {
    if (!result.success) {
      return c.json({ error: 'Validation failed', code: 'VALIDATION_ERROR', statusCode: 400 }, 400)
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
      return c.json({ error: 'Validation failed', code: 'VALIDATION_ERROR', statusCode: 400 }, 400)
    }
  }),
  async (c) => {
    const guestId = c.req.param('id')
    const data = c.req.valid('json')
    const dbUserId = c.get('dbUserId')
    const weddingId = c.get('weddingId')

    const updated = await guestService.updateGuest(guestId, data, dbUserId, weddingId)

    if (!updated) {
      return c.json({ error: 'Guest not found', code: 'GUEST_NOT_FOUND', statusCode: 404 }, 404)
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
      console.error('Delete guest failed:', err)
      return c.json({ error: 'Delete failed', code: 'DELETE_FAILED', statusCode: 404 }, 404)
    }
  },
)

// POST /guests/bulk-import — CSV import (gated)
guestsRoute.post(
  '/bulk-import',
  resolveWeddingMiddleware,
  requireFeature('canBulkImport'),
  requireGuestLimit,
  zValidator(
    'json',
    z.object({
      weddingId: z.string().uuid(),
      csvContent: z.string().min(1).max(500_000),
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
    const { csvContent } = c.req.valid('json')
    const weddingId = c.get('weddingId')
    const dbUserId = c.get('dbUserId')

    const result = await guestService.bulkImportCsv(weddingId, csvContent, dbUserId)
    return c.json({ data: result })
  },
)

// POST /guests/:id/send-invite — send RSVP invite email to a single guest
guestsRoute.post('/:id/send-invite', resolveWeddingMiddleware, async (c) => {
  const guestId = c.req.param('id')
  const weddingId = c.get('weddingId')

  const guest = await guestService.getGuest(guestId)
  if (!guest || guest.weddingId !== weddingId) {
    return c.json({ error: 'Guest not found', code: 'GUEST_NOT_FOUND', statusCode: 404 }, 404)
  }

  if (!guest.email) {
    return c.json({ error: 'Guest has no email address', code: 'NO_EMAIL', statusCode: 400 }, 400)
  }

  const [wedding] = await db.select().from(weddings).where(eq(weddings.id, weddingId))
  if (!wedding) {
    return c.json({ error: 'Wedding not found', code: 'NOT_FOUND', statusCode: 404 }, 404)
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const rsvpUrl = `${appUrl}/rsvp/${guest.rsvpToken}`

  const weddingDateStr = wedding.date
    ? new Date(wedding.date).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : null

  const rsvpDeadlineStr = wedding.rsvpDeadline
    ? new Date(wedding.rsvpDeadline).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : null

  try {
    await emailService.sendRsvpInvite(
      guest.email,
      `${guest.firstName} ${guest.lastName}`,
      wedding.name,
      weddingDateStr,
      wedding.venue,
      rsvpUrl,
      rsvpDeadlineStr,
    )

    await guestService.markInviteSent(guestId)

    return c.json({ data: { success: true } })
  } catch (err) {
    console.error('Send invite failed:', err)
    return c.json({ error: 'Failed to send invite', code: 'EMAIL_FAILED', statusCode: 500 }, 500)
  }
})

// POST /guests/send-invites — bulk send RSVP invites to all uninvited guests with email
guestsRoute.post(
  '/send-invites',
  resolveWeddingMiddleware,
  zValidator(
    'json',
    z.object({
      weddingId: z.string().uuid(),
      guestIds: z.array(z.string().uuid()).min(1).max(200).optional(),
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
    const { guestIds } = c.req.valid('json')
    const weddingId = c.get('weddingId')

    const [wedding] = await db.select().from(weddings).where(eq(weddings.id, weddingId))
    if (!wedding) {
      return c.json({ error: 'Wedding not found', code: 'NOT_FOUND', statusCode: 404 }, 404)
    }

    const uninvitedGuests = await guestService.getGuestsForInvite(weddingId)
    const toSend = guestIds
      ? uninvitedGuests.filter((g) => guestIds.includes(g.id))
      : uninvitedGuests

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

    const weddingDateStr = wedding.date
      ? new Date(wedding.date).toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })
      : null

    const rsvpDeadlineStr = wedding.rsvpDeadline
      ? new Date(wedding.rsvpDeadline).toLocaleDateString('en-US', {
          month: 'long',
          day: 'numeric',
          year: 'numeric',
        })
      : null

    let sent = 0
    let failed = 0

    for (const guest of toSend) {
      if (!guest.email) continue
      const rsvpUrl = `${appUrl}/rsvp/${guest.rsvpToken}`
      try {
        await emailService.sendRsvpInvite(
          guest.email,
          `${guest.firstName} ${guest.lastName}`,
          wedding.name,
          weddingDateStr,
          wedding.venue,
          rsvpUrl,
          rsvpDeadlineStr,
        )
        await guestService.markInviteSent(guest.id)
        sent++
      } catch {
        failed++
      }
    }

    return c.json({ data: { sent, failed, total: toSend.length } })
  },
)

// POST /guests/:id/tags — assign tags to guest
guestsRoute.post(
  '/:id/tags',
  resolveWeddingMiddleware,
  zValidator(
    'json',
    z.object({
      tagIds: z.array(z.string().uuid()).min(1).max(20),
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
    const guestId = c.req.param('id')
    const weddingId = c.get('weddingId')
    const { tagIds } = c.req.valid('json')

    const guest = await guestService.getGuest(guestId)
    if (!guest || guest.weddingId !== weddingId) {
      return c.json({ error: 'Guest not found', code: 'GUEST_NOT_FOUND', statusCode: 404 }, 404)
    }

    await guestService.setTagsForGuest(guestId, tagIds, weddingId)
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
    return c.json({ error: 'Guest not found', code: 'GUEST_NOT_FOUND', statusCode: 404 }, 404)
  }

  const { guestTagService } = await import('../services/guest-tags.js')

  const tag = await guestTagService.getTag(tagId)
  if (!tag || tag.weddingId !== weddingId) {
    return c.json({ error: 'Tag not found', code: 'NOT_FOUND', statusCode: 404 }, 404)
  }

  await guestTagService.removeTag(guestId, tagId)
  return c.json({ data: { success: true } })
})
