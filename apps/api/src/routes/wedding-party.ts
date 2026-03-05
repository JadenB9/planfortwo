import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import {
  createPartyMemberSchema,
  updatePartyMemberSchema,
  createPartyTaskSchema,
  updatePartyTaskSchema,
  createPartyGiftSchema,
} from '@planfortwo/validators'
import { authMiddleware } from '../middleware/auth.js'
import { resolveUserMiddleware } from '../middleware/resolve-user.js'
import { resolveWeddingMiddleware } from '../middleware/resolve-wedding.js'
import { weddingPartyService } from '../services/wedding-party.js'

type Env = {
  Variables: {
    clerkUserId: string
    dbUserId: string
    dbUser: { id: string; email: string; firstName: string; lastName: string }
    weddingId: string
    membershipRole: string
  }
}

export const weddingPartyRoute = new Hono<Env>()

weddingPartyRoute.use('*', authMiddleware, resolveUserMiddleware)

weddingPartyRoute.get('/', resolveWeddingMiddleware, async (c) => {
  const weddingId = c.get('weddingId')
  const members = await weddingPartyService.list(weddingId)
  return c.json({ data: members })
})

weddingPartyRoute.get('/:id', resolveWeddingMiddleware, async (c) => {
  const memberId = c.req.param('id')
  const weddingId = c.get('weddingId')
  const member = await weddingPartyService.getById(memberId, weddingId)
  if (!member) return c.json({ error: 'Member not found', code: 'NOT_FOUND', statusCode: 404 }, 404)
  return c.json({ data: member })
})

weddingPartyRoute.post(
  '/',
  zValidator('json', createPartyMemberSchema, (result, c) => {
    if (!result.success) return c.json({ error: 'Validation failed', code: 'VALIDATION_ERROR', statusCode: 400 }, 400)
  }),
  async (c) => {
    const data = c.req.valid('json')
    const dbUserId = c.get('dbUserId')
    const member = await weddingPartyService.create(data, dbUserId)
    return c.json({ data: member }, 201)
  },
)

weddingPartyRoute.put(
  '/:id',
  resolveWeddingMiddleware,
  zValidator('json', updatePartyMemberSchema, (result, c) => {
    if (!result.success) return c.json({ error: 'Validation failed', code: 'VALIDATION_ERROR', statusCode: 400 }, 400)
  }),
  async (c) => {
    const memberId = c.req.param('id')
    const weddingId = c.get('weddingId')
    const data = c.req.valid('json')
    const updated = await weddingPartyService.update(memberId, weddingId, data)
    if (!updated) return c.json({ error: 'Member not found', code: 'NOT_FOUND', statusCode: 404 }, 404)
    return c.json({ data: updated })
  },
)

weddingPartyRoute.delete('/:id', resolveWeddingMiddleware, async (c) => {
  const memberId = c.req.param('id')
  const weddingId = c.get('weddingId')
  const deleted = await weddingPartyService.delete(memberId, weddingId)
  if (!deleted) return c.json({ error: 'Member not found', code: 'NOT_FOUND', statusCode: 404 }, 404)
  return c.json({ data: { success: true } })
})

weddingPartyRoute.get('/:id/tasks', resolveWeddingMiddleware, async (c) => {
  const memberId = c.req.param('id')
  const weddingId = c.get('weddingId')
  const member = await weddingPartyService.getById(memberId, weddingId)
  if (!member) return c.json({ error: 'Member not found', code: 'NOT_FOUND', statusCode: 404 }, 404)
  const tasks = await weddingPartyService.listTasks(memberId)
  return c.json({ data: tasks })
})

weddingPartyRoute.post(
  '/:id/tasks',
  resolveWeddingMiddleware,
  zValidator('json', createPartyTaskSchema, (result, c) => {
    if (!result.success) return c.json({ error: 'Validation failed', code: 'VALIDATION_ERROR', statusCode: 400 }, 400)
  }),
  async (c) => {
    const memberId = c.req.param('id')
    const weddingId = c.get('weddingId')
    const member = await weddingPartyService.getById(memberId, weddingId)
    if (!member) return c.json({ error: 'Member not found', code: 'NOT_FOUND', statusCode: 404 }, 404)
    const data = c.req.valid('json')
    const task = await weddingPartyService.createTask(data)
    return c.json({ data: task }, 201)
  },
)

weddingPartyRoute.put(
  '/tasks/:taskId',
  resolveWeddingMiddleware,
  zValidator('json', updatePartyTaskSchema, (result, c) => {
    if (!result.success) return c.json({ error: 'Validation failed', code: 'VALIDATION_ERROR', statusCode: 400 }, 400)
  }),
  async (c) => {
    const taskId = c.req.param('taskId')
    const data = c.req.valid('json')
    const updated = await weddingPartyService.updateTask(taskId, data)
    if (!updated) return c.json({ error: 'Task not found', code: 'NOT_FOUND', statusCode: 404 }, 404)
    return c.json({ data: updated })
  },
)

weddingPartyRoute.delete('/tasks/:taskId', resolveWeddingMiddleware, async (c) => {
  const taskId = c.req.param('taskId')
  await weddingPartyService.deleteTask(taskId)
  return c.json({ data: { success: true } })
})

weddingPartyRoute.get('/:id/gifts', resolveWeddingMiddleware, async (c) => {
  const memberId = c.req.param('id')
  const weddingId = c.get('weddingId')
  const member = await weddingPartyService.getById(memberId, weddingId)
  if (!member) return c.json({ error: 'Member not found', code: 'NOT_FOUND', statusCode: 404 }, 404)
  const gifts = await weddingPartyService.listGifts(memberId)
  return c.json({ data: gifts })
})

weddingPartyRoute.post(
  '/:id/gifts',
  resolveWeddingMiddleware,
  zValidator('json', createPartyGiftSchema, (result, c) => {
    if (!result.success) return c.json({ error: 'Validation failed', code: 'VALIDATION_ERROR', statusCode: 400 }, 400)
  }),
  async (c) => {
    const memberId = c.req.param('id')
    const weddingId = c.get('weddingId')
    const member = await weddingPartyService.getById(memberId, weddingId)
    if (!member) return c.json({ error: 'Member not found', code: 'NOT_FOUND', statusCode: 404 }, 404)
    const data = c.req.valid('json')
    const gift = await weddingPartyService.createGift(data)
    return c.json({ data: gift }, 201)
  },
)

weddingPartyRoute.delete('/gifts/:giftId', resolveWeddingMiddleware, async (c) => {
  const giftId = c.req.param('giftId')
  await weddingPartyService.deleteGift(giftId)
  return c.json({ data: { success: true } })
})
