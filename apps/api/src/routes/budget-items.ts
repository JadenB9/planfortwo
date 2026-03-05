import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import {
  createBudgetItemSchema,
  updateBudgetItemSchema,
  budgetItemFiltersSchema,
} from '@planfortwo/validators'
import { authMiddleware } from '../middleware/auth.js'
import { resolveUserMiddleware } from '../middleware/resolve-user.js'
import { resolveWeddingMiddleware } from '../middleware/resolve-wedding.js'
import { requireFeature } from '../middleware/require-feature.js'
import { budgetItemService } from '../services/budget-items.js'

type Env = {
  Variables: {
    clerkUserId: string
    dbUserId: string
    dbUser: { id: string; email: string; firstName: string; lastName: string }
    weddingId: string
    membershipRole: string
  }
}

export const budgetItemsRoute = new Hono<Env>()

budgetItemsRoute.use('*', authMiddleware, resolveUserMiddleware)

// GET /budget-items?weddingId=X — list items with filters
budgetItemsRoute.get(
  '/',
  resolveWeddingMiddleware,
  zValidator('query', budgetItemFiltersSchema, (result, c) => {
    if (!result.success) {
      return c.json({ error: 'Validation failed', code: 'VALIDATION_ERROR', statusCode: 400 }, 400)
    }
  }),
  async (c) => {
    const filters = c.req.valid('query')
    const result = await budgetItemService.list(filters)
    return c.json(result)
  },
)

// GET /budget-items/:id — single item
budgetItemsRoute.get('/:id', resolveWeddingMiddleware, async (c) => {
  const itemId = c.req.param('id')
  const weddingId = c.get('weddingId')

  const item = await budgetItemService.get(itemId, weddingId)

  if (!item) {
    return c.json({ error: 'Budget item not found', code: 'ITEM_NOT_FOUND', statusCode: 404 }, 404)
  }

  return c.json({ data: item })
})

// POST /budget-items — create item (gated)
budgetItemsRoute.post(
  '/',
  resolveWeddingMiddleware,
  requireFeature('canBudgetExpenses'),
  zValidator('json', createBudgetItemSchema, (result, c) => {
    if (!result.success) {
      return c.json({ error: 'Validation failed', code: 'VALIDATION_ERROR', statusCode: 400 }, 400)
    }
  }),
  async (c) => {
    const data = c.req.valid('json')
    const dbUserId = c.get('dbUserId')

    const item = await budgetItemService.create(data, dbUserId)
    return c.json({ data: item }, 201)
  },
)

// PUT /budget-items/:id — update item (gated)
budgetItemsRoute.put(
  '/:id',
  resolveWeddingMiddleware,
  requireFeature('canBudgetExpenses'),
  zValidator('json', updateBudgetItemSchema, (result, c) => {
    if (!result.success) {
      return c.json({ error: 'Validation failed', code: 'VALIDATION_ERROR', statusCode: 400 }, 400)
    }
  }),
  async (c) => {
    const itemId = c.req.param('id')
    const data = c.req.valid('json')
    const dbUserId = c.get('dbUserId')
    const weddingId = c.get('weddingId')

    const updated = await budgetItemService.update(itemId, weddingId, data, dbUserId)

    if (!updated) {
      return c.json(
        { error: 'Budget item not found', code: 'ITEM_NOT_FOUND', statusCode: 404 },
        404,
      )
    }

    return c.json({ data: updated })
  },
)

// DELETE /budget-items/:id — delete item (gated)
budgetItemsRoute.delete(
  '/:id',
  resolveWeddingMiddleware,
  requireFeature('canBudgetExpenses'),
  async (c) => {
    const itemId = c.req.param('id')
    const dbUserId = c.get('dbUserId')
    const weddingId = c.get('weddingId')

    try {
      await budgetItemService.delete(itemId, weddingId, dbUserId)
      return c.json({ data: { success: true } })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Delete failed'
      return c.json({ error: message, code: 'DELETE_FAILED', statusCode: 404 }, 404)
    }
  },
)

// POST /budget-items/:id/upload-url — get presigned upload URL (gated)
budgetItemsRoute.post(
  '/:id/upload-url',
  resolveWeddingMiddleware,
  requireFeature('canBudgetExpenses'),
  zValidator(
    'json',
    z.object({
      weddingId: z.string().uuid(),
      fileName: z.string().min(1).max(255),
      contentType: z
        .string()
        .regex(/^(image\/(jpeg|png|gif|webp)|application\/pdf)$/, 'Must be an image or PDF'),
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
    const itemId = c.req.param('id')
    const weddingId = c.get('weddingId')
    const { fileName, contentType } = c.req.valid('json')

    const result = await budgetItemService.getUploadUrl(weddingId, itemId, fileName, contentType)
    return c.json({ data: result })
  },
)
