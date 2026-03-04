import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import {
  createHouseholdSchema,
  updateHouseholdSchema,
} from '@planfortwo/validators'
import { authMiddleware } from '../middleware/auth.js'
import { resolveUserMiddleware } from '../middleware/resolve-user.js'
import { resolveWeddingMiddleware } from '../middleware/resolve-wedding.js'
import { householdService } from '../services/households.js'

type Env = {
  Variables: {
    clerkUserId: string
    dbUserId: string
    dbUser: { id: string; email: string; firstName: string; lastName: string }
    weddingId: string
    membershipRole: string
  }
}

export const householdsRoute = new Hono<Env>()

householdsRoute.use('*', authMiddleware, resolveUserMiddleware)

// GET /households?weddingId=X — list households with guests
householdsRoute.get(
  '/',
  resolveWeddingMiddleware,
  async (c) => {
    const weddingId = c.get('weddingId')
    const result = await householdService.listHouseholds(weddingId)
    return c.json({ data: result })
  },
)

// GET /households/:id — single household with guests
householdsRoute.get('/:id', async (c) => {
  const id = c.req.param('id')
  const household = await householdService.getHousehold(id)

  if (!household) {
    return c.json(
      { error: 'Household not found', code: 'HOUSEHOLD_NOT_FOUND', statusCode: 404 },
      404,
    )
  }

  return c.json({ data: household })
})

// POST /households — create household
householdsRoute.post(
  '/',
  zValidator('json', createHouseholdSchema, (result, c) => {
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

    const household = await householdService.createHousehold(data, dbUserId)
    return c.json({ data: household }, 201)
  },
)

// PUT /households/:id — update household
householdsRoute.put(
  '/:id',
  zValidator('json', updateHouseholdSchema, (result, c) => {
    if (!result.success) {
      return c.json(
        { error: 'Validation failed', code: 'VALIDATION_ERROR', statusCode: 400 },
        400,
      )
    }
  }),
  async (c) => {
    const id = c.req.param('id')
    const data = c.req.valid('json')

    const updated = await householdService.updateHousehold(id, data)

    if (!updated) {
      return c.json(
        { error: 'Household not found', code: 'HOUSEHOLD_NOT_FOUND', statusCode: 404 },
        404,
      )
    }

    return c.json({ data: updated })
  },
)

// DELETE /households/:id?weddingId=X — delete household
householdsRoute.delete('/:id', async (c) => {
  const id = c.req.param('id')
  const dbUserId = c.get('dbUserId')
  const weddingId = c.req.query('weddingId')

  if (!weddingId) {
    return c.json(
      { error: 'Wedding ID required', code: 'MISSING_WEDDING_ID', statusCode: 400 },
      400,
    )
  }

  try {
    await householdService.deleteHousehold(id, dbUserId, weddingId)
    return c.json({ data: { success: true } })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Delete failed'
    return c.json(
      { error: message, code: 'DELETE_FAILED', statusCode: 404 },
      404,
    )
  }
})
