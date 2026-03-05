import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import {
  createThankYouNoteSchema,
  updateThankYouNoteSchema,
  createVendorReviewSchema,
  updateNotificationPreferencesSchema,
  createNameChangeTaskSchema,
} from '@planfortwo/validators'
import { authMiddleware } from '../middleware/auth.js'
import { resolveUserMiddleware } from '../middleware/resolve-user.js'
import { resolveWeddingMiddleware } from '../middleware/resolve-wedding.js'
import {
  thankYouService,
  nameChangeService,
  vendorReviewService,
  notificationPrefService,
} from '../services/post-wedding.js'

type Env = {
  Variables: {
    clerkUserId: string
    dbUserId: string
    dbUser: { id: string; email: string; firstName: string; lastName: string }
    weddingId: string
    membershipRole: string
  }
}

export const thankYouRoute = new Hono<Env>()
export const nameChangeRoute = new Hono<Env>()
export const vendorReviewsRoute = new Hono<Env>()
export const notificationPrefsRoute = new Hono<Env>()

// ── Thank You Notes ──
thankYouRoute.use('*', authMiddleware, resolveUserMiddleware)

thankYouRoute.get('/', resolveWeddingMiddleware, async (c) => {
  const weddingId = c.get('weddingId')
  const notes = await thankYouService.list(weddingId)
  return c.json({ data: notes })
})

thankYouRoute.get('/:id', resolveWeddingMiddleware, async (c) => {
  const noteId = c.req.param('id')
  const weddingId = c.get('weddingId')
  const note = await thankYouService.getById(noteId, weddingId)
  if (!note) return c.json({ error: 'Note not found', code: 'NOT_FOUND', statusCode: 404 }, 404)
  return c.json({ data: note })
})

thankYouRoute.post(
  '/',
  resolveWeddingMiddleware,
  zValidator('json', createThankYouNoteSchema, (result, c) => {
    if (!result.success)
      return c.json({ error: 'Validation failed', code: 'VALIDATION_ERROR', statusCode: 400 }, 400)
  }),
  async (c) => {
    const data = c.req.valid('json')
    const note = await thankYouService.create(data)
    return c.json({ data: note }, 201)
  },
)

thankYouRoute.put(
  '/:id',
  resolveWeddingMiddleware,
  zValidator('json', updateThankYouNoteSchema, (result, c) => {
    if (!result.success)
      return c.json({ error: 'Validation failed', code: 'VALIDATION_ERROR', statusCode: 400 }, 400)
  }),
  async (c) => {
    const noteId = c.req.param('id')
    const weddingId = c.get('weddingId')
    const data = c.req.valid('json')
    const updated = await thankYouService.update(noteId, weddingId, data)
    if (!updated)
      return c.json({ error: 'Note not found', code: 'NOT_FOUND', statusCode: 404 }, 404)
    return c.json({ data: updated })
  },
)

thankYouRoute.delete('/:id', resolveWeddingMiddleware, async (c) => {
  const noteId = c.req.param('id')
  const weddingId = c.get('weddingId')
  const deleted = await thankYouService.delete(noteId, weddingId)
  if (!deleted) return c.json({ error: 'Note not found', code: 'NOT_FOUND', statusCode: 404 }, 404)
  return c.json({ data: { success: true } })
})

// ── Name Change Tasks ──
nameChangeRoute.use('*', authMiddleware, resolveUserMiddleware)

nameChangeRoute.get('/', resolveWeddingMiddleware, async (c) => {
  const weddingId = c.get('weddingId')
  const tasks = await nameChangeService.list(weddingId)
  return c.json({ data: tasks })
})

nameChangeRoute.post(
  '/',
  resolveWeddingMiddleware,
  zValidator('json', createNameChangeTaskSchema, (result, c) => {
    if (!result.success)
      return c.json({ error: 'Validation failed', code: 'VALIDATION_ERROR', statusCode: 400 }, 400)
  }),
  async (c) => {
    const weddingId = c.get('weddingId')
    const { institution, description, documentsRequired } = c.req.valid('json')
    const task = await nameChangeService.create(
      weddingId,
      institution,
      description ?? undefined,
      documentsRequired ?? undefined,
    )
    return c.json({ data: task }, 201)
  },
)

nameChangeRoute.put('/:id/toggle', resolveWeddingMiddleware, async (c) => {
  const taskId = c.req.param('id')
  const weddingId = c.get('weddingId')
  const updated = await nameChangeService.toggleComplete(taskId, weddingId)
  if (!updated) return c.json({ error: 'Task not found', code: 'NOT_FOUND', statusCode: 404 }, 404)
  return c.json({ data: updated })
})

nameChangeRoute.delete('/:id', resolveWeddingMiddleware, async (c) => {
  const taskId = c.req.param('id')
  const weddingId = c.get('weddingId')
  const deleted = await nameChangeService.delete(taskId, weddingId)
  if (!deleted) return c.json({ error: 'Task not found', code: 'NOT_FOUND', statusCode: 404 }, 404)
  return c.json({ data: { success: true } })
})

// ── Vendor Reviews ──
vendorReviewsRoute.use('*', authMiddleware, resolveUserMiddleware)

vendorReviewsRoute.get('/', resolveWeddingMiddleware, async (c) => {
  const weddingId = c.get('weddingId')
  const reviews = await vendorReviewService.list(weddingId)
  return c.json({ data: reviews })
})

vendorReviewsRoute.post(
  '/',
  resolveWeddingMiddleware,
  zValidator('json', createVendorReviewSchema, (result, c) => {
    if (!result.success)
      return c.json({ error: 'Validation failed', code: 'VALIDATION_ERROR', statusCode: 400 }, 400)
  }),
  async (c) => {
    const data = c.req.valid('json')
    const review = await vendorReviewService.create(data)
    return c.json({ data: review }, 201)
  },
)

vendorReviewsRoute.delete('/:id', resolveWeddingMiddleware, async (c) => {
  const reviewId = c.req.param('id')
  const weddingId = c.get('weddingId')
  const deleted = await vendorReviewService.delete(reviewId, weddingId)
  if (!deleted)
    return c.json({ error: 'Review not found', code: 'NOT_FOUND', statusCode: 404 }, 404)
  return c.json({ data: { success: true } })
})

// ── Notification Preferences ──
notificationPrefsRoute.use('*', authMiddleware, resolveUserMiddleware)

notificationPrefsRoute.get('/', resolveWeddingMiddleware, async (c) => {
  const userId = c.get('dbUserId')
  const weddingId = c.get('weddingId')
  const prefs = await notificationPrefService.get(userId, weddingId)
  return c.json({ data: prefs })
})

notificationPrefsRoute.put(
  '/',
  resolveWeddingMiddleware,
  zValidator('json', updateNotificationPreferencesSchema, (result, c) => {
    if (!result.success)
      return c.json({ error: 'Validation failed', code: 'VALIDATION_ERROR', statusCode: 400 }, 400)
  }),
  async (c) => {
    const userId = c.get('dbUserId')
    const weddingId = c.get('weddingId')
    const data = c.req.valid('json')
    const prefs = await notificationPrefService.upsert(userId, weddingId, data)
    return c.json({ data: prefs })
  },
)
