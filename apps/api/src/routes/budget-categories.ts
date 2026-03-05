import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { createBudgetCategorySchema, updateBudgetCategorySchema } from '@planfortwo/validators'
import { authMiddleware } from '../middleware/auth.js'
import { resolveUserMiddleware } from '../middleware/resolve-user.js'
import { resolveWeddingMiddleware } from '../middleware/resolve-wedding.js'
import { requireFeature } from '../middleware/require-feature.js'
import { budgetCategoryService } from '../services/budget-categories.js'

type Env = {
  Variables: {
    clerkUserId: string
    dbUserId: string
    dbUser: { id: string; email: string; firstName: string; lastName: string }
    weddingId: string
    membershipRole: string
  }
}

export const budgetCategoriesRoute = new Hono<Env>()

budgetCategoriesRoute.use('*', authMiddleware, resolveUserMiddleware)

// GET /budget-categories?weddingId=X — list categories
budgetCategoriesRoute.get('/', resolveWeddingMiddleware, async (c) => {
  const weddingId = c.get('weddingId')
  const categories = await budgetCategoryService.list(weddingId)
  return c.json({ data: categories })
})

// POST /budget-categories — create category (gated)
budgetCategoriesRoute.post(
  '/',
  requireFeature('canBudgetCategories'),
  zValidator('json', createBudgetCategorySchema, (result, c) => {
    if (!result.success) {
      return c.json({ error: 'Validation failed', code: 'VALIDATION_ERROR', statusCode: 400 }, 400)
    }
  }),
  async (c) => {
    const data = c.req.valid('json')
    const dbUserId = c.get('dbUserId')

    const category = await budgetCategoryService.create(data, dbUserId)
    return c.json({ data: category }, 201)
  },
)

// POST /budget-categories/seed-defaults — seed default categories (gated)
budgetCategoriesRoute.post(
  '/seed-defaults',
  requireFeature('canBudgetCategories'),
  zValidator(
    'json',
    z.object({
      weddingId: z.string().uuid(),
      totalBudget: z.number().min(0).max(10_000_000).optional(),
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
    const { weddingId, totalBudget } = c.req.valid('json')
    const dbUserId = c.get('dbUserId')

    await budgetCategoryService.seedDefaults(weddingId, totalBudget, dbUserId)
    return c.json({ data: { success: true } }, 201)
  },
)

// PUT /budget-categories/:id — update category (gated)
budgetCategoriesRoute.put(
  '/:id',
  resolveWeddingMiddleware,
  requireFeature('canBudgetCategories'),
  zValidator('json', updateBudgetCategorySchema, (result, c) => {
    if (!result.success) {
      return c.json({ error: 'Validation failed', code: 'VALIDATION_ERROR', statusCode: 400 }, 400)
    }
  }),
  async (c) => {
    const categoryId = c.req.param('id')
    const data = c.req.valid('json')
    const weddingId = c.get('weddingId')

    const updated = await budgetCategoryService.update(categoryId, weddingId, data)

    if (!updated) {
      return c.json(
        { error: 'Category not found', code: 'CATEGORY_NOT_FOUND', statusCode: 404 },
        404,
      )
    }

    return c.json({ data: updated })
  },
)

// DELETE /budget-categories/:id — delete category (gated)
budgetCategoriesRoute.delete(
  '/:id',
  resolveWeddingMiddleware,
  requireFeature('canBudgetCategories'),
  async (c) => {
    const categoryId = c.req.param('id')
    const dbUserId = c.get('dbUserId')
    const weddingId = c.get('weddingId')

    try {
      await budgetCategoryService.delete(categoryId, weddingId, dbUserId)
      return c.json({ data: { success: true } })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Delete failed'
      return c.json({ error: message, code: 'DELETE_FAILED', statusCode: 404 }, 404)
    }
  },
)
