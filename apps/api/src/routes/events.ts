import { Hono } from 'hono'
import { bodyLimit } from 'hono/body-limit'
import { zValidator } from '@hono/zod-validator'
import {
  createEventSchema,
  updateEventSchema,
  createTimelineEntrySchema,
  updateTimelineEntrySchema,
  setEventMapSchema,
} from '@planfortwo/validators'
import { authMiddleware } from '../middleware/auth.js'
import { resolveUserMiddleware } from '../middleware/resolve-user.js'
import { resolveWeddingMiddleware } from '../middleware/resolve-wedding.js'
import { eventService } from '../services/events.js'

type Env = {
  Variables: {
    clerkUserId: string
    dbUserId: string
    dbUser: { id: string; email: string; firstName: string; lastName: string }
    weddingId: string
    membershipRole: string
  }
}

export const eventsRoute = new Hono<Env>()

eventsRoute.use('*', authMiddleware, resolveUserMiddleware)

eventsRoute.get('/', resolveWeddingMiddleware, async (c) => {
  const weddingId = c.get('weddingId')
  const list = await eventService.list(weddingId)
  return c.json({ data: list })
})

eventsRoute.get('/:id', resolveWeddingMiddleware, async (c) => {
  const eventId = c.req.param('id')
  const weddingId = c.get('weddingId')
  const event = await eventService.getById(eventId, weddingId)
  if (!event) return c.json({ error: 'Event not found', code: 'NOT_FOUND', statusCode: 404 }, 404)
  return c.json({ data: event })
})

eventsRoute.post(
  '/',
  resolveWeddingMiddleware,
  zValidator('json', createEventSchema, (result, c) => {
    if (!result.success)
      return c.json({ error: 'Validation failed', code: 'VALIDATION_ERROR', statusCode: 400 }, 400)
  }),
  async (c) => {
    const data = c.req.valid('json')
    const dbUserId = c.get('dbUserId')
    const event = await eventService.create(data, dbUserId)
    return c.json({ data: event }, 201)
  },
)

eventsRoute.put(
  '/:id',
  resolveWeddingMiddleware,
  zValidator('json', updateEventSchema, (result, c) => {
    if (!result.success)
      return c.json({ error: 'Validation failed', code: 'VALIDATION_ERROR', statusCode: 400 }, 400)
  }),
  async (c) => {
    const eventId = c.req.param('id')
    const weddingId = c.get('weddingId')
    const data = c.req.valid('json')
    const updated = await eventService.update(eventId, weddingId, data)
    if (!updated)
      return c.json({ error: 'Event not found', code: 'NOT_FOUND', statusCode: 404 }, 404)
    return c.json({ data: updated })
  },
)

eventsRoute.delete('/:id', resolveWeddingMiddleware, async (c) => {
  const eventId = c.req.param('id')
  const weddingId = c.get('weddingId')
  const deleted = await eventService.delete(eventId, weddingId)
  if (!deleted) return c.json({ error: 'Event not found', code: 'NOT_FOUND', statusCode: 404 }, 404)
  return c.json({ data: { success: true } })
})

eventsRoute.get('/:id/timeline', resolveWeddingMiddleware, async (c) => {
  const eventId = c.req.param('id')
  const weddingId = c.get('weddingId')
  const event = await eventService.getById(eventId, weddingId)
  if (!event) return c.json({ error: 'Event not found', code: 'NOT_FOUND', statusCode: 404 }, 404)
  const entries = await eventService.listTimeline(eventId)
  return c.json({ data: entries })
})

eventsRoute.post(
  '/:id/timeline',
  resolveWeddingMiddleware,
  zValidator('json', createTimelineEntrySchema, (result, c) => {
    if (!result.success)
      return c.json({ error: 'Validation failed', code: 'VALIDATION_ERROR', statusCode: 400 }, 400)
  }),
  async (c) => {
    const eventId = c.req.param('id')
    const weddingId = c.get('weddingId')
    const event = await eventService.getById(eventId, weddingId)
    if (!event) return c.json({ error: 'Event not found', code: 'NOT_FOUND', statusCode: 404 }, 404)
    const data = c.req.valid('json')
    const entry = await eventService.createTimelineEntry(data)
    return c.json({ data: entry }, 201)
  },
)

eventsRoute.put(
  '/timeline/:entryId',
  resolveWeddingMiddleware,
  zValidator('json', updateTimelineEntrySchema, (result, c) => {
    if (!result.success)
      return c.json({ error: 'Validation failed', code: 'VALIDATION_ERROR', statusCode: 400 }, 400)
  }),
  async (c) => {
    const entryId = c.req.param('entryId')
    const weddingId = c.get('weddingId')
    const data = c.req.valid('json')
    const updated = await eventService.updateTimelineEntry(entryId, weddingId, data)
    if (!updated)
      return c.json({ error: 'Entry not found', code: 'NOT_FOUND', statusCode: 404 }, 404)
    return c.json({ data: updated })
  },
)

eventsRoute.delete('/timeline/:entryId', resolveWeddingMiddleware, async (c) => {
  const entryId = c.req.param('entryId')
  const weddingId = c.get('weddingId')
  await eventService.deleteTimelineEntry(entryId, weddingId)
  return c.json({ data: { success: true } })
})

// PUT /events/:id/map?weddingId=X — save rendered map image + overlays
// Larger body limit needed for base64-encoded PNG (≈5.4 MB at 4 MB binary cap)
eventsRoute.put(
  '/:id/map',
  bodyLimit({ maxSize: 8 * 1024 * 1024 }),
  resolveWeddingMiddleware,
  zValidator('json', setEventMapSchema, (result, c) => {
    if (!result.success)
      return c.json({ error: 'Validation failed', code: 'VALIDATION_ERROR', statusCode: 400 }, 400)
  }),
  async (c) => {
    const eventId = c.req.param('id')
    const weddingId = c.get('weddingId')
    const data = c.req.valid('json')
    try {
      const updated = await eventService.setMap(eventId, weddingId, data)
      if (!updated)
        return c.json({ error: 'Event not found', code: 'NOT_FOUND', statusCode: 404 }, 404)
      return c.json({ data: updated })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save map'
      return c.json({ error: message, code: 'MAP_UPLOAD_FAILED', statusCode: 400 }, 400)
    }
  },
)

eventsRoute.delete('/:id/map', resolveWeddingMiddleware, async (c) => {
  const eventId = c.req.param('id')
  const weddingId = c.get('weddingId')
  const updated = await eventService.clearMap(eventId, weddingId)
  if (!updated) return c.json({ error: 'Event not found', code: 'NOT_FOUND', statusCode: 404 }, 404)
  return c.json({ data: updated })
})
