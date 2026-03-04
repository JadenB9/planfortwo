import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import {
  createPaymentScheduleSchema,
  updatePaymentScheduleSchema,
} from '@planfortwo/validators'
import { authMiddleware } from '../middleware/auth.js'
import { resolveUserMiddleware } from '../middleware/resolve-user.js'
import { resolveWeddingMiddleware } from '../middleware/resolve-wedding.js'
import { requireFeature } from '../middleware/require-feature.js'
import { paymentScheduleService } from '../services/payment-schedule.js'

type Env = {
  Variables: {
    clerkUserId: string
    dbUserId: string
    dbUser: { id: string; email: string; firstName: string; lastName: string }
    weddingId: string
    membershipRole: string
  }
}

export const paymentScheduleRoute = new Hono<Env>()

paymentScheduleRoute.use('*', authMiddleware, resolveUserMiddleware)

// GET /payment-schedule?weddingId=X&filter=upcoming|overdue|all
paymentScheduleRoute.get(
  '/',
  resolveWeddingMiddleware,
  zValidator('query', z.object({
    weddingId: z.string().uuid(),
    filter: z.enum(['upcoming', 'overdue', 'all']).default('all'),
  }), (result, c) => {
    if (!result.success) {
      return c.json(
        { error: 'Validation failed', code: 'VALIDATION_ERROR', statusCode: 400 },
        400,
      )
    }
  }),
  async (c) => {
    const { weddingId, filter } = c.req.valid('query')
    const payments = await paymentScheduleService.list(weddingId, filter)
    return c.json({ data: payments })
  },
)

// POST /payment-schedule — create payment (gated)
paymentScheduleRoute.post(
  '/',
  requireFeature('canPaymentSchedule'),
  zValidator('json', createPaymentScheduleSchema, (result, c) => {
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

    const payment = await paymentScheduleService.create(data, dbUserId)
    return c.json({ data: payment }, 201)
  },
)

// PUT /payment-schedule/:id — update payment (gated)
paymentScheduleRoute.put(
  '/:id',
  requireFeature('canPaymentSchedule'),
  zValidator('json', updatePaymentScheduleSchema, (result, c) => {
    if (!result.success) {
      return c.json(
        { error: 'Validation failed', code: 'VALIDATION_ERROR', statusCode: 400 },
        400,
      )
    }
  }),
  async (c) => {
    const paymentId = c.req.param('id')
    const data = c.req.valid('json')
    const dbUserId = c.get('dbUserId')
    const weddingId = c.req.query('weddingId')

    if (!weddingId) {
      return c.json(
        { error: 'Wedding ID required', code: 'MISSING_WEDDING_ID', statusCode: 400 },
        400,
      )
    }

    const updated = await paymentScheduleService.update(paymentId, weddingId, data, dbUserId)

    if (!updated) {
      return c.json(
        { error: 'Payment not found', code: 'PAYMENT_NOT_FOUND', statusCode: 404 },
        404,
      )
    }

    return c.json({ data: updated })
  },
)

// DELETE /payment-schedule/:id — delete payment (gated)
paymentScheduleRoute.delete(
  '/:id',
  requireFeature('canPaymentSchedule'),
  async (c) => {
    const paymentId = c.req.param('id')
    const dbUserId = c.get('dbUserId')
    const weddingId = c.req.query('weddingId')

    if (!weddingId) {
      return c.json(
        { error: 'Wedding ID required', code: 'MISSING_WEDDING_ID', statusCode: 400 },
        400,
      )
    }

    try {
      await paymentScheduleService.delete(paymentId, weddingId, dbUserId)
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
