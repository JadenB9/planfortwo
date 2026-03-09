import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import {
  createHoneymoonPlanSchema,
  updateHoneymoonPlanSchema,
  createHoneymoonActivitySchema,
  updateHoneymoonActivitySchema,
} from '@planfortwo/validators'
import { authMiddleware } from '../middleware/auth.js'
import { resolveUserMiddleware } from '../middleware/resolve-user.js'
import { resolveWeddingMiddleware } from '../middleware/resolve-wedding.js'
import { honeymoonService } from '../services/honeymoon.js'

type Env = {
  Variables: {
    clerkUserId: string
    dbUserId: string
    dbUser: { id: string; email: string; firstName: string; lastName: string }
    weddingId: string
    membershipRole: string
  }
}

export const honeymoonRoute = new Hono<Env>()

honeymoonRoute.use('*', authMiddleware, resolveUserMiddleware)

honeymoonRoute.get('/', resolveWeddingMiddleware, async (c) => {
  const weddingId = c.get('weddingId')
  const plans = await honeymoonService.listPlans(weddingId)
  return c.json({ data: plans })
})

honeymoonRoute.get('/:id', resolveWeddingMiddleware, async (c) => {
  const id = c.req.param('id')
  const weddingId = c.get('weddingId')
  const plan = await honeymoonService.getPlan(id, weddingId)
  if (!plan) return c.json({ error: 'Not found', code: 'NOT_FOUND', statusCode: 404 }, 404)
  return c.json({ data: plan })
})

honeymoonRoute.post(
  '/',
  resolveWeddingMiddleware,
  zValidator('json', createHoneymoonPlanSchema, (result, c) => {
    if (!result.success)
      return c.json({ error: 'Validation failed', code: 'VALIDATION_ERROR', statusCode: 400 }, 400)
  }),
  async (c) => {
    const data = c.req.valid('json')
    const weddingId = c.get('weddingId')
    const plan = await honeymoonService.createPlan({ ...data, weddingId })
    return c.json({ data: plan }, 201)
  },
)

honeymoonRoute.put(
  '/:id',
  resolveWeddingMiddleware,
  zValidator('json', updateHoneymoonPlanSchema, (result, c) => {
    if (!result.success)
      return c.json({ error: 'Validation failed', code: 'VALIDATION_ERROR', statusCode: 400 }, 400)
  }),
  async (c) => {
    const id = c.req.param('id')
    const weddingId = c.get('weddingId')
    const data = c.req.valid('json')
    const updated = await honeymoonService.updatePlan(id, weddingId, data)
    if (!updated) return c.json({ error: 'Not found', code: 'NOT_FOUND', statusCode: 404 }, 404)
    return c.json({ data: updated })
  },
)

honeymoonRoute.delete('/:id', resolveWeddingMiddleware, async (c) => {
  const id = c.req.param('id')
  const weddingId = c.get('weddingId')
  const deleted = await honeymoonService.deletePlan(id, weddingId)
  if (!deleted) return c.json({ error: 'Not found', code: 'NOT_FOUND', statusCode: 404 }, 404)
  return c.json({ data: { success: true } })
})

honeymoonRoute.post(
  '/:id/activities',
  resolveWeddingMiddleware,
  zValidator('json', createHoneymoonActivitySchema, (result, c) => {
    if (!result.success)
      return c.json({ error: 'Validation failed', code: 'VALIDATION_ERROR', statusCode: 400 }, 400)
  }),
  async (c) => {
    const data = c.req.valid('json')
    const planId = c.req.param('id')
    const activity = await honeymoonService.addActivity({ ...data, planId })
    return c.json({ data: activity }, 201)
  },
)

honeymoonRoute.put(
  '/activities/:activityId',
  resolveWeddingMiddleware,
  zValidator('json', updateHoneymoonActivitySchema, (result, c) => {
    if (!result.success)
      return c.json({ error: 'Validation failed', code: 'VALIDATION_ERROR', statusCode: 400 }, 400)
  }),
  async (c) => {
    const activityId = c.req.param('activityId')
    const weddingId = c.get('weddingId')
    const data = c.req.valid('json')
    const updated = await honeymoonService.updateActivity(activityId, weddingId, data)
    if (!updated) return c.json({ error: 'Not found', code: 'NOT_FOUND', statusCode: 404 }, 404)
    return c.json({ data: updated })
  },
)

honeymoonRoute.delete('/activities/:activityId', resolveWeddingMiddleware, async (c) => {
  const activityId = c.req.param('activityId')
  const weddingId = c.get('weddingId')
  const deleted = await honeymoonService.deleteActivity(activityId, weddingId)
  if (!deleted) return c.json({ error: 'Not found', code: 'NOT_FOUND', statusCode: 404 }, 404)
  return c.json({ data: { success: true } })
})
