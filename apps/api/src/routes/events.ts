import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import {
  createEventSchema,
  updateEventSchema,
  createTimelineEntrySchema,
  updateTimelineEntrySchema,
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
    const data = c.req.valid('json')
    const updated = await eventService.updateTimelineEntry(entryId, data)
    if (!updated)
      return c.json({ error: 'Entry not found', code: 'NOT_FOUND', statusCode: 404 }, 404)
    return c.json({ data: updated })
  },
)

eventsRoute.delete('/timeline/:entryId', resolveWeddingMiddleware, async (c) => {
  const entryId = c.req.param('entryId')
  await eventService.deleteTimelineEntry(entryId)
  return c.json({ data: { success: true } })
})
